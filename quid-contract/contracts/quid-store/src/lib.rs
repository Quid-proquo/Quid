#![no_std]
use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, String};

mod error;
mod types;

use error::QuidError;
use soroban_sdk::token;
use types::{DataKey, Mission, MissionStatus, Submission, SubmissionStatus};

#[contractevent(topics = ["mission", "create"])]
pub struct MissionCreateEvent {
    pub mission_id: u64,
    pub owner: Address,
}

#[contractevent(topics = ["sub", "new"])]
pub struct SubNewEvent {
    pub mission_id: u64,
    pub hunter: Address,
}

#[contractevent(topics = ["payout", "done"])]
pub struct PayoutDoneEvent {
    pub mission_id: u64,
    pub hunter: Address,
}

#[contractevent(topics = ["mission", "cancel"], data_format = "single-value")]
pub struct MissionCancelEvent {
    pub mission_id: u64,
}

#[contracttype]
pub struct Reward {
    pub reward_token: Address,
    pub reward_amount: i128,
}

#[contracttype]
pub struct MinAsset {
    pub min_asset_token: Option<Address>,
    pub min_asset_amount: i128,
}

#[contractevent(topics = ["mission", "pause"], data_format = "single-value")]
pub struct MissionPauseEvent {
    pub mission_id: u64,
}

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
        reward: Reward,
        max_participants: u32,
        min_asset: MinAsset,
    ) -> Result<u64, QuidError> {
        owner.require_auth();

        Self::validate_mission_params(&title, reward.reward_amount)?;

        // Validate optional asset gating
        if min_asset.min_asset_token.is_some() && min_asset.min_asset_amount <= 0 {
            return Err(QuidError::InvalidAmount);
        }

        let total_needed: i128 = reward
            .reward_amount
            .checked_mul(max_participants as i128)
            .ok_or(QuidError::NegativeReward)?;

        let token_client = token::Client::new(&env, &reward.reward_token);
        token_client.transfer(&owner, env.current_contract_address(), &total_needed);

        let mission_id = Self::get_next_mission_id(&env);

        let created_at = env.ledger().timestamp();

        // let reward = Reward {
        //     reward_token,
        //     reward_amount
        // }

        let mission = Mission {
            id: mission_id,
            owner: owner.clone(),
            title,
            description_cid,
            reward_token: reward.reward_token,
            reward_amount: reward.reward_amount,
            max_participants,
            participants_count: 0,
            status: MissionStatus::Open,
            created_at,
            min_asset: min_asset.min_asset_token,
            min_asset_amount: min_asset.min_asset_amount,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Mission(mission_id), 5184000, 5184000);

        MissionCreateEvent { mission_id, owner }.publish(&env);

        Ok(mission_id)
    }

    /// Get mission
    pub fn get_mission(env: Env, mission_id: u64) -> Result<Mission, QuidError> {
        env.storage()
            .persistent()
            .get(&DataKey::Mission(mission_id))
            .ok_or(QuidError::MissionNotFound)
    }

    /// Submit Feedback
    pub fn submit_feedback(
        env: Env,
        mission_id: u64,
        hunter: Address,
        ipfs_cid: String,
        stake_token: Address,
        stake_amount: i128,
    ) -> Result<(), QuidError> {
        hunter.require_auth();

        let mission = Self::get_mission(env.clone(), mission_id)?;

        if mission.status != MissionStatus::Open && mission.status != MissionStatus::Started {
            return Err(QuidError::MissionNotOpen);
        }
        if mission.participants_count >= mission.max_participants {
            return Err(QuidError::MissionFull);
        }

        let key = DataKey::Submission(mission_id, hunter.clone());

        if env.storage().persistent().has(&key) {
            return Err(QuidError::AlreadySubmitted);
        }

        if stake_amount <= 0 {
            return Err(QuidError::InvalidAmount);
        }

        let token_client = token::Client::new(&env, &stake_token);
        token_client.transfer(&hunter, env.current_contract_address(), &stake_amount);

        let stake_key = DataKey::HunterStake(mission_id, hunter.clone());
        env.storage().persistent().set(&stake_key, &stake_amount);
        env.storage()
            .persistent()
            .extend_ttl(&stake_key, 5184000, 5184000);

        let submission = Submission {
            hunter: hunter.clone(),
            ipfs_cid,
            status: SubmissionStatus::Pending,
            submitted_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&key, &submission);
        env.storage()
            .persistent()
            .extend_ttl(&key, 5184000, 5184000);

        SubNewEvent { mission_id, hunter }.publish(&env);

        Ok(())
    }

    /// Update Submission
    pub fn update_submission(
        env: Env,
        mission_id: u64,
        hunter: Address,
        new_ipfs_cid: String,
    ) -> Result<(), QuidError> {
        hunter.require_auth();

        let mission = Self::get_mission(env.clone(), mission_id)?;

        if mission.status != MissionStatus::Open {
            return Err(QuidError::MissionNotOpen);
        }

        let key = DataKey::Submission(mission_id, hunter.clone());

        if !env.storage().persistent().has(&key) {
            return Err(QuidError::SubmissionNotFound);
        }

        let submission: Submission = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(QuidError::SubmissionNotFound)?;

        if submission.status == SubmissionStatus::Paid {
            return Err(QuidError::AlreadyPaid);
        }

        let updated_submission = Submission {
            hunter: submission.hunter,
            ipfs_cid: new_ipfs_cid,
            status: submission.status,
            submitted_at: submission.submitted_at,
        };

        env.storage().persistent().set(&key, &updated_submission);
        env.storage()
            .persistent()
            .extend_ttl(&key, 5184000, 5184000);

        Ok(())
    }

    /// Payout Participant
    pub fn payout_participant(env: Env, mission_id: u64, hunter: Address) -> Result<(), QuidError> {
        let mut mission = Self::get_mission(env.clone(), mission_id)?;
        mission.owner.require_auth();

        if matches!(
            mission.status,
            MissionStatus::Completed | MissionStatus::Cancelled
        ) {
            return Err(QuidError::MissionClosed);
        }

        let key = DataKey::Submission(mission_id, hunter.clone());
        let mut submission: Submission = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(QuidError::SubmissionNotFound)?;

        if submission.status == SubmissionStatus::Paid {
            return Err(QuidError::AlreadyPaid);
        }
        if submission.status != SubmissionStatus::Pending {
            return Err(QuidError::NotPending);
        }

        let token_client = token::Client::new(&env, &mission.reward_token);
        token_client.transfer(
            &env.current_contract_address(),
            &hunter,
            &mission.reward_amount,
        );

        submission.status = SubmissionStatus::Paid;
        env.storage().persistent().set(&key, &submission);

        mission.participants_count += 1;
        if mission.max_participants > 0 && mission.participants_count >= mission.max_participants {
            mission.status = MissionStatus::Completed;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Mission(mission_id), &mission);

        PayoutDoneEvent { mission_id, hunter }.publish(&env);

        Ok(())
    }

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

        MissionCancelEvent { mission_id }.publish(&env);

        Ok(())
    }

    pub fn pause_mission(env: Env, id: u64) -> Result<(), QuidError> {
        let mut mission = Self::get_mission(env.clone(), id)?;
        mission.owner.require_auth();
        mission.status = MissionStatus::Paused;
        env.storage()
            .persistent()
            .set(&DataKey::Mission(id), &mission);

        MissionPauseEvent { mission_id: id }.publish(&env);
        Ok(())
    }

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
        Ok(())
    }

    /// Slash a hunter's stake for spam submissions.
    /// Only the mission owner may invoke this.
    pub fn slash_hunter_stake(
        env: Env,
        mission_id: u64,
        hunter: Address,
        stake_token: Address,
    ) -> Result<(), QuidError> {
        let mission = Self::get_mission(env.clone(), mission_id)?;
        mission.owner.require_auth();
        Self::slash_stake(&env, mission_id, hunter, stake_token)
    }

    pub fn get_mission_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::MissionCount)
            .unwrap_or(0)
    }

    pub fn mission_exists(env: Env, mission_id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Mission(mission_id))
    }

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
        count += 1;
        env.storage().instance().set(&DataKey::MissionCount, &count);
        count
    }

    /// Set the protocol treasury address. Must be called by the treasury itself.
    pub fn set_treasury(env: Env, treasury: Address) {
        treasury.require_auth();
        env.storage().instance().set(&DataKey::Treasury, &treasury);
    }

    /// Get the protocol treasury address.
    pub fn get_treasury(env: Env) -> Result<Address, QuidError> {
        env.storage()
            .instance()
            .get(&DataKey::Treasury)
            .ok_or(QuidError::TreasuryNotSet)
    }

    /// Slash a hunter's stake by sending it to the protocol treasury.
    fn slash_stake(
        env: &Env,
        mission_id: u64,
        hunter: Address,
        stake_token: Address,
    ) -> Result<(), QuidError> {
        let key = DataKey::HunterStake(mission_id, hunter);

        let amount: i128 = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(QuidError::StakeNotFound)?;

        let treasury = Self::get_treasury(env.clone())?;

        token::Client::new(env, &stake_token).transfer(
            &env.current_contract_address(),
            &treasury,
            &amount,
        );

        env.storage().persistent().remove(&key);

        Ok(())
    }
}
mod test;
