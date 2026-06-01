#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env};

mod error;
use error::ReputationError;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    pub subject: Address,
    pub successful_missions: u32,
    pub rejected_submissions: u32,
    pub reviewer_score: u32,
    pub founder_score: u32,
    pub total_earnings: i128,
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Profile(Address),
}

#[contractevent(topics = ["profile", "updated"])]
pub struct ProfileUpdatedEvent {
    pub subject: Address,
    pub successful_missions: u32,
    pub rejected_submissions: u32,
    pub reviewer_score: u32,
    pub founder_score: u32,
    pub total_earnings: i128,
}

#[contract]
pub struct QuidReputationContract;

#[contractimpl]
impl QuidReputationContract {
    /// Initialize the contract with an admin address.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Get the stored admin address.
    pub fn get_admin(env: Env) -> Result<Address, ReputationError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotAuthorized)
    }

    /// Admin-only upsert: write a full profile snapshot for a subject.
    ///
    /// # Arguments
    /// - `subject`: The address whose profile is being written.
    /// - `successful_missions`: Count of successfully completed missions.
    /// - `rejected_submissions`: Count of rejected submissions.
    /// - `reviewer_score`: Score assigned by reviewers (0-100).
    /// - `founder_score`: Score assigned by founders (0-100).
    /// - `total_earnings`: Total earnings in the reward token's base unit.
    ///
    /// # Errors
    /// - `NotAuthorized` if caller is not the configured admin.
    /// - `InvalidEarnings` if `total_earnings` is negative.
    /// - `InvalidScore` if reviewer or founder score exceeds 100.
    pub fn upsert_profile(
        env: Env,
        subject: Address,
        successful_missions: u32,
        rejected_submissions: u32,
        reviewer_score: u32,
        founder_score: u32,
        total_earnings: i128,
    ) -> Result<(), ReputationError> {
        // 1. Require admin auth
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotAuthorized)?;
        admin.require_auth();

        // 2. Validate inputs
        if total_earnings < 0 {
            return Err(ReputationError::InvalidEarnings);
        }
        if reviewer_score > 100 {
            return Err(ReputationError::InvalidScore);
        }
        if founder_score > 100 {
            return Err(ReputationError::InvalidScore);
        }

        // 3. Build profile snapshot
        let profile = Profile {
            subject: subject.clone(),
            successful_missions,
            rejected_submissions,
            reviewer_score,
            founder_score,
            total_earnings,
            updated_at: env.ledger().timestamp(),
        };

        // 4. Store the profile
        env.storage()
            .persistent()
            .set(&DataKey::Profile(subject.clone()), &profile);

        // 5. Publish event
        ProfileUpdatedEvent {
            subject,
            successful_missions,
            rejected_submissions,
            reviewer_score,
            founder_score,
            total_earnings,
        }
        .publish(&env);

        Ok(())
    }

    /// Read a profile for a given subject.
    pub fn get_profile(env: Env, subject: Address) -> Result<Profile, ReputationError> {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(subject))
            .ok_or(ReputationError::ProfileNotFound)
    }
}

#[cfg(test)]
mod test;
