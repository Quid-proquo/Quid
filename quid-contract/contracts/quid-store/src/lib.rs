#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

mod error;
mod types;
use error::QuidError;
use soroban_sdk::token;
use types::{DataKey, Mission, MissionStatus, SubmissionStatus};

/// Quid Store Contract
#[contract]
pub struct QuidStoreContract;

#[contractimpl]
impl QuidStoreContract {
    /// Create mission
    pub fn create_mission(
        env: Env,
        owner: Address,
        title: String,
        description_cid: String,
        reward_token: Address,
        reward_amount: i128,
        max_participants: u32,
    ) -> Result<u64, QuidError> {
        owner.require_auth();

        Self::validate_mission_params(&title, reward_amount)?;

        let total_needed: i128 = reward_amount
            .checked_mul(max_participants as i128)
            .ok_or(QuidError::NegativeReward)?;

        let token_client = token::Client::new(&env, &reward_token);
        token_client.transfer(&owner, env.current_contract_address(), &total_needed);

        let mission_id = Self::get_next_mission_id(&env);

        let mut created_at = env.ledger().timestamp();
        if created_at == 0 {
            created_at = 1;
        }

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

        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Mission(mission_id), 5184000, 5184000);

        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "mission_created"), owner.clone()),
            mission_id,
        );

        Ok(mission_id)
    }

    /// Get mission
    pub fn get_mission(env: Env, mission_id: u64) -> Result<Mission, QuidError> {
        env.storage()
            .persistent()
            .get(&DataKey::Mission(mission_id))
            .ok_or(QuidError::MissionNotFound)
    }

    /// Batch missions
    pub fn get_missions(env: Env, mission_ids: Vec<u64>) -> Vec<Result<Mission, QuidError>> {
        let mut results = Vec::new(&env);

        for mission_id in mission_ids.iter() {
            results.push_back(Self::get_mission(env.clone(), mission_id));
        }

        results
    }

    /// Exists check
    pub fn mission_exists(env: Env, mission_id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Mission(mission_id))
    }

    /// Reward only
    pub fn get_mission_reward(env: Env, mission_id: u64) -> Result<(Address, i128), QuidError> {
        let mission = Self::get_mission(env, mission_id)?;
        Ok((mission.reward_token, mission.reward_amount))
    }

    /// Status only
    pub fn get_mission_status(env: Env, mission_id: u64) -> Result<MissionStatus, QuidError> {
        let mission = Self::get_mission(env, mission_id)?;
        Ok(mission.status)
    }

    /// Cancel mission
    pub fn cancel_mission(env: Env, mission_id: u64) -> Result<(), QuidError> {
        let mut mission = Self::get_mission(env.clone(), mission_id)?;

        mission.owner.require_auth();

        if matches!(
            mission.status,
            MissionStatus::Cancelled | MissionStatus::Completed
        ) {
            return Err(QuidError::MissionClosed);
        }

        let remaining_slots = mission
            .max_participants
            .saturating_sub(mission.participants_count);

        let refund_amount: i128 = (remaining_slots as i128)
            .checked_mul(mission.reward_amount)
            .ok_or(QuidError::NegativeReward)?;

        if refund_amount > 0 {
            let token_client = token::Client::new(&env, &mission.reward_token);
            token_client.transfer(
                &env.current_contract_address(),
                &mission.owner,
                &refund_amount,
            );
        }

        mission.status = MissionStatus::Cancelled;

        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "mission_cancelled"), mission_id),
            refund_amount,
        );

        Ok(())
    }

    /// Mission count
    pub fn get_mission_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::MissionCount)
            .unwrap_or(0)
    }

    /// Update status
    pub fn update_mission_status(
        env: Env,
        mission_id: u64,
        new_status: MissionStatus,
    ) -> Result<(), QuidError> {
        let mut mission = Self::get_mission(env.clone(), mission_id)?;

        mission.owner.require_auth();
        mission.status = new_status;

        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "mission_status_updated"), mission_id),
            new_status,
        );

        Ok(())
    }

    // ---------- Helpers ----------
    /// Pauses an open mission
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `id` - The mission identifier
    ///
    /// # Errors
    /// * `QuidError::MissionNotFound` - If mission doesn't exist
    /// * `QuidError::NotAuthorized` - If caller is not the owner
    pub fn pause_mission(env: Env, id: u64) -> Result<(), QuidError> {
        // 1. Load Mission
        let mut mission = Self::get_mission(env.clone(), id)?;

        // 2. Authenticate Owner
        mission.owner.require_auth();

        // 3. Update State
        mission.status = MissionStatus::Paused;

        // 4. Save to Storage
        env.storage()
            .persistent()
            .set(&DataKey::Mission(id), &mission);

        // Emit event for monitoring
        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "mission_paused"), id),
            MissionStatus::Paused,
        );

        Ok(())
    }

    pub fn submit_feedback(
        env: Env,
        mission_id: u64,
        hunter: Address,
        ipfs_cid: String,
    ) -> Result<(), QuidError> {
        hunter.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Submission(mission_id, hunter.clone()), &ipfs_cid);
        Ok(())
    }

    // ========== Private Helper Methods ==========

    fn validate_mission_params(_title: &String, reward_amount: i128) -> Result<(), QuidError> {
        if reward_amount <= 0 {
            return Err(QuidError::NegativeReward);
        }
        Ok(())
    }

    fn get_next_mission_id(env: &Env) -> u64 {
        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::MissionCount)
            .unwrap_or(0);

        count = count.checked_add(1).expect("Mission count overflow");

        env.storage().instance().set(&DataKey::MissionCount, &count);

        count
    }

    pub fn payout_participant(env: Env, mission_id: u64, hunter: Address) -> Result<(), QuidError> {
        // 1. Load Mission & Authenticate
        let mut mission = Self::get_mission(env.clone(), mission_id)?;
        mission.owner.require_auth();

        // 2. Validate Submission
        // Validation: Submission must be Pending. Mission must be Open.
        if matches!(
            mission.status,
            MissionStatus::Completed | MissionStatus::Cancelled | MissionStatus::Paused
        ) {
            return Err(QuidError::MissionClosed);
        }

        let submission_key = DataKey::Submission(mission_id, hunter.clone());
        let submission_status: SubmissionStatus = env
            .storage()
            .persistent()
            .get(&submission_key)
            .ok_or(QuidError::SubmissionNotFound)?;

        if submission_status == SubmissionStatus::Paid {
            return Err(QuidError::AlreadyPaid);
        }

        if submission_status != SubmissionStatus::Pending {
            return Err(QuidError::NotPending);
        }

        let paid_key = DataKey::Paid(mission_id, hunter.clone());
        if env.storage().persistent().has(&paid_key) {
            return Err(QuidError::AlreadyPaid);
        }

        // 3. Execute Payout
        let token_client = token::Client::new(&env, &mission.reward_token);
        token_client.transfer(
            &env.current_contract_address(),
            &hunter,
            &mission.reward_amount,
        );

        // 4. Update States
        mission.participants_count += 1;
        if mission.max_participants > 0 && mission.participants_count >= mission.max_participants {
            mission.status = MissionStatus::Completed;
        }

        env.storage().persistent().set(&paid_key, &true);
        env.storage()
            .persistent()
            .set(&submission_key, &SubmissionStatus::Paid);
        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        #[allow(deprecated)]
        env.events().publish(
            (String::from_str(&env, "payout"), mission_id, hunter),
            mission.reward_amount,
        );

        Ok(())
    }
}

mod test;
