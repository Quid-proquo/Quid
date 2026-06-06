#![no_std]
use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, String};

mod error;
mod types;

use error::ReputationError;
use types::{Attestation, DataKey, Profile};

const PROFILE_TTL_LEDGERS: u32 = 5_184_000;

#[contractevent(topics = ["attestation", "revoked"])]
pub struct AttestationRevokedEvent {
    pub attestation_id: u64,
    pub revoked_by: Address,
}

#[contractevent(topics = ["profile", "updated"])]
pub struct ProfileUpdatedEvent {
    pub subject: Address,
}

#[contract]
pub struct QuidReputationContract;

#[contractimpl]
impl QuidReputationContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), ReputationError> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ReputationError::InvalidInput);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn get_admin(env: Env) -> Result<Address, ReputationError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotAuthorized)
    }

    pub fn issue_attestation(
        env: Env,
        issuer: Address,
        subject: Address,
        attestation_type: String,
        data_cid: String,
    ) -> Result<u64, ReputationError> {
        issuer.require_auth();

        let attestation_id = Self::get_next_attestation_id(&env);
        let issued_at = env.ledger().timestamp();

        let attestation = Attestation {
            id: attestation_id,
            issuer,
            subject,
            attestation_type,
            data_cid,
            issued_at,
            revoked: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.storage().persistent().extend_ttl(
            &DataKey::Attestation(attestation_id),
            PROFILE_TTL_LEDGERS,
            PROFILE_TTL_LEDGERS,
        );

        Ok(attestation_id)
    }

    pub fn get_attestation(env: Env, attestation_id: u64) -> Result<Attestation, ReputationError> {
        env.storage()
            .persistent()
            .get(&DataKey::Attestation(attestation_id))
            .ok_or(ReputationError::AttestationNotFound)
    }

    pub fn revoke_attestation(
        env: Env,
        caller: Address,
        attestation_id: u64,
    ) -> Result<(), ReputationError> {
        caller.require_auth();

        let mut attestation = Self::get_attestation(env.clone(), attestation_id)?;

        if attestation.revoked {
            return Err(ReputationError::AlreadyRevoked);
        }

        let admin = Self::get_admin(env.clone())?;
        if caller != attestation.issuer && caller != admin {
            return Err(ReputationError::NotAuthorized);
        }

        attestation.revoked = true;
        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.storage().persistent().extend_ttl(
            &DataKey::Attestation(attestation_id),
            PROFILE_TTL_LEDGERS,
            PROFILE_TTL_LEDGERS,
        );

        AttestationRevokedEvent {
            attestation_id,
            revoked_by: caller,
        }
        .publish(&env);

        Ok(())
    }

    pub fn get_attestation_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::AttestationCount)
            .unwrap_or(0)
    }

    pub fn attestation_exists(env: Env, attestation_id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Attestation(attestation_id))
    }

    pub fn get_profile(env: Env, subject: Address) -> Result<Profile, ReputationError> {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(subject))
            .ok_or(ReputationError::ProfileNotFound)
    }

    pub fn set_profile(env: Env, profile: Profile) -> Result<(), ReputationError> {
        profile.subject.require_auth();

        env.storage()
            .persistent()
            .set(&DataKey::Profile(profile.subject.clone()), &profile);

        env.storage().persistent().extend_ttl(
            &DataKey::Profile(profile.subject),
            PROFILE_TTL_LEDGERS,
            PROFILE_TTL_LEDGERS,
        );

        Ok(())
    }

    pub fn profile_exists(env: Env, subject: Address) -> bool {
        env.storage().persistent().has(&DataKey::Profile(subject))
    }

    /// Admin-only upsert: write a full profile snapshot for a subject.
    pub fn upsert_profile(
        env: Env,
        subject: Address,
        score: i64,
        missions_completed: u32,
        missions_created: u32,
        total_earnings: i128,
    ) -> Result<(), ReputationError> {
        let admin = Self::get_admin(env.clone())?;
        admin.require_auth();

        if total_earnings < 0 {
            return Err(ReputationError::InvalidRewardAmount);
        }

        let profile = Profile {
            subject: subject.clone(),
            score,
            missions_completed,
            missions_created,
        };

        Self::store_profile(&env, &profile);

        ProfileUpdatedEvent { subject }.publish(&env);

        Ok(())
    }

    fn get_next_attestation_id(env: &Env) -> u64 {
        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AttestationCount)
            .unwrap_or(0);
        count += 1;
        env.storage()
            .instance()
            .set(&DataKey::AttestationCount, &count);
        count
    }
}

#[allow(dead_code)]
impl QuidReputationContract {
    pub(crate) fn require_admin(env: &Env, caller: &Address) -> Result<(), ReputationError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotAuthorized)?;

        admin.require_auth();

        if *caller != admin {
            return Err(ReputationError::NotAuthorized);
        }

        Ok(())
    }

    pub(crate) fn store_profile(env: &Env, profile: &Profile) {
        let key = DataKey::Profile(profile.subject.clone());
        env.storage().persistent().set(&key, profile);
        env.storage()
            .persistent()
            .extend_ttl(&key, PROFILE_TTL_LEDGERS, PROFILE_TTL_LEDGERS);
    }

    pub(crate) fn load_or_default(env: &Env, subject: Address) -> Profile {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(subject.clone()))
            .unwrap_or(Profile {
                subject,
                score: 0,
                missions_completed: 0,
                missions_created: 0,
            })
    }
}

mod test;