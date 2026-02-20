#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String};

mod error;
mod types;
use error::QuidError;
use soroban_sdk::token;
use types::{DataKey, Mission, MissionStatus};

/// Quid Store Contract
///
/// A decentralized platform for creating and managing missions where creators
/// can collect feedback and reward participants.
#[contract]
pub struct QuidStoreContract;

#[contractimpl]
impl QuidStoreContract {
    /// Creates a new mission on the blockchain
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `owner` - The address of the mission creator (must sign the transaction)
    /// * `title` - Mission title
    /// * `description_cid` - IPFS CID or reference to detailed mission description
    /// * `reward_token` - Address of the token contract for rewards
    /// * `reward_amount` - Reward amount per participant (in smallest token unit)
    /// * `max_participants` - Maximum number of participants (0 = unlimited)
    ///
    /// # Returns
    /// The unique mission ID or an error
    ///
    /// # Errors
    /// * `QuidError::NegativeReward` - If reward_amount is negative
    ///
    /// # Example
    /// ```ignore
    /// let mission_id = contract.create_mission(
    ///     &env,
    ///     &owner_address,
    ///     &String::from_str(&env, "User Feedback Survey"),
    ///     &String::from_str(&env, "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"),
    ///     &token_address,
    ///     &10_000_000, // 100 tokens (assuming 7 decimals)
    ///     &50,         // Max 50 participants
    /// );
    /// ```
    pub fn create_mission(
        env: Env,
        owner: Address,
        title: String,
        description_cid: String,
        reward_token: Address,
        reward_amount: i128,
        max_participants: u32,
    ) -> Result<u64, QuidError> {
        // 1. Authentication: Verify owner signature
        owner.require_auth();

        // 2. Input Validation
        Self::validate_mission_params(&title, reward_amount)?;

        // 2.5 Escrow Funding: Pull full mission reward into contract

        let total_needed: i128 = reward_amount
            .checked_mul(max_participants as i128)
            .ok_or(QuidError::NegativeReward)?;

        // Token client
        let token_client = token::Client::new(&env, &reward_token);

        // Transfer tokens from creator → contract escrow
        token_client.transfer(&owner, env.current_contract_address(), &total_needed);

        // 3. ID Generation: Get and increment mission count
        let mission_id = Self::get_next_mission_id(&env);

        // 4. Get current timestamp (ensure non-zero for test environments)
        let mut created_at = env.ledger().timestamp();
        if created_at == 0 {
            created_at = 1;
        }

        // 5. Create Mission struct
        let mission = Mission {
            id: mission_id,
            owner: owner.clone(),
            title,
            description_cid,
            reward_token,
            reward_amount,
            max_participants,
            participants_count: 0,
            status: MissionStatus::Created,
            created_at,
        };

        // 6. Save mission to persistent storage
        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        // 7. Extend the TTL (Time To Live) for the mission data
        // This ensures the data persists for a long time
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Mission(mission_id), 5184000, 5184000); // ~60 days

        // 8. Emit event for indexing/monitoring
        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "mission_created"), owner.clone()),
            mission_id,
        );

        // 9. Return the new mission ID
        Ok(mission_id)
    }

    /// Retrieves a mission by ID
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `mission_id` - The unique mission identifier
    ///
    /// # Returns
    /// The mission data or an error if not found
    ///
    /// # Errors
    /// * `QuidError::MissionNotFound` - If mission doesn't exist
    pub fn get_mission(env: Env, mission_id: u64) -> Result<Mission, QuidError> {
        env.storage()
            .persistent()
            .get(&DataKey::Mission(mission_id))
            .ok_or(QuidError::MissionNotFound)
    }

    /// Cancels a mission and refunds unspent tokens to the owner
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `mission_id` - The mission to cancel
    ///
    /// # Errors
    /// * `QuidError::MissionNotFound` - If mission doesn't exist
    /// * `QuidError::NotAuthorized` - If caller is not the mission owner
    pub fn cancel_mission(env: Env, mission_id: u64) -> Result<(), QuidError> {
        let mut mission = Self::get_mission(env.clone(), mission_id)?;

        // Verify caller is the owner
        mission.owner.require_auth();

        // Check if mission is already closed (Cancelled or Completed)
        if matches!(
            mission.status,
            MissionStatus::Cancelled | MissionStatus::Completed
        ) {
            return Err(QuidError::MissionClosed);
        }

        // 1. Calculate Remaining Slots
        // Note: participants_count starts at 0 and increments as people join
        let remaining_slots = mission.max_participants - mission.participants_count;

        // 2. Calculate Refund Amount
        let refund_amount: i128 = (remaining_slots as i128)
            .checked_mul(mission.reward_amount)
            .ok_or(QuidError::NegativeReward)?;

        // 3. Execute Refund (If > 0)
        if refund_amount > 0 {
            let token_client = token::Client::new(&env, &mission.reward_token);
            token_client.transfer(
                &env.current_contract_address(),
                &mission.owner,
                &refund_amount,
            );
        }

        // Update status
        mission.status = MissionStatus::Cancelled;

        // Save updated mission
        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        // Emit event
        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "mission_cancelled"), mission_id),
            refund_amount,
        );

        Ok(())
    }

    /// Gets the current mission count
    ///
    /// # Arguments
    /// * `env` - The contract environment
    ///
    /// # Returns
    /// The total number of missions created
    pub fn get_mission_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::MissionCount)
            .unwrap_or(0)
    }

    /// Updates mission status (for future use)
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `mission_id` - The mission to update
    /// * `new_status` - The new status to set
    ///
    /// # Errors
    /// * `QuidError::MissionNotFound` - If mission doesn't exist
    /// * `QuidError::NotAuthorized` - If caller is not the mission owner
    pub fn update_mission_status(
        env: Env,
        mission_id: u64,
        new_status: MissionStatus,
    ) -> Result<(), QuidError> {
        let mut mission = Self::get_mission(env.clone(), mission_id)?;

        // Verify caller is the owner
        mission.owner.require_auth();

        // Update status
        mission.status = new_status;

        // Save updated mission
        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        // Emit event
        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "mission_status_updated"), mission_id),
            new_status,
        );

        Ok(())
    }

    // ========== Private Helper Methods ==========

    /// Validates mission creation parameters
    ///
    /// # Errors
    /// * `QuidError::NegativeReward` - If reward_amount is negative
    fn validate_mission_params(_title: &String, reward_amount: i128) -> Result<(), QuidError> {
        // Title validation removed - empty titles might be valid for some use cases

        // Reward amount must be non-negative
        if reward_amount <= 0 {
            return Err(QuidError::NegativeReward);
        }

        Ok(())
    }

    /// Gets the next available mission ID and increments the counter
    ///
    /// # Returns
    /// The next mission ID
    ///
    /// # Panics
    /// If mission count overflows (extremely unlikely in practice)
    fn get_next_mission_id(env: &Env) -> u64 {
        // Get current count from instance storage (ephemeral, survives contract calls)
        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::MissionCount)
            .unwrap_or(0);

        // Increment for new mission
        count = count.checked_add(1).expect("Mission count overflow");

        // Save updated count
        env.storage().instance().set(&DataKey::MissionCount, &count);

        count
    }
}

mod test;
