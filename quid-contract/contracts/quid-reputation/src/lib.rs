#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, String};

mod error;
mod types;

use error::QuidError;
use types::{Attestation, DataKey, Profile};

const PROFILE_TTL_LEDGERS: u32 = 5_184_000;

#[contractevent(topics = ["attestation", "issued"])]
pub struct AttestationIssuedEvent {
    pub attestation_id: u64,
    pub issuer: Address,
    pub subject: Address,
}

#[contractevent(topics = ["attestation", "revoked"], data_format = "single-value")]
pub struct AttestationRevokedEvent {
    pub attestation_id: u64,
}

#[contract]
pub struct QuidReputationContract;

#[contractimpl]
impl QuidReputationContract {
    /// Bootstrap admin for the contract
    pub fn bootstrap_admin(env: Env, admin: Address) -> Result<(), QuidError> {
        if env.storage().persistent().has(&DataKey::Admin) {
            return Err(QuidError::AdminAlreadySet);
        }

        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Admin, 5184000, 5184000);

        Ok(())
    }

    /// Get the current admin
    pub fn get_admin(env: Env) -> Result<Address, QuidError> {
        env.storage()
            .persistent()
            .get(&DataKey::Admin)
            .ok_or(QuidError::AdminNotSet)
    }

    /// Issue an attestation for a subject
    pub fn issue_attestation(
        env: Env,
        issuer: Address,
        subject: Address,
        kind: String,
        label: String,
        metadata_cid: Option<String>,
        expires_at: Option<u64>,
    ) -> Result<u64, QuidError> {
        issuer.require_auth();

        if label.is_empty() {
            return Err(QuidError::InvalidLabel);
        }

        if let Some(expiry) = expires_at {
            let now = env.ledger().timestamp();
            if expiry <= now {
                return Err(QuidError::InvalidExpiryTime);
            }
        }

        let attestation_id = Self::get_next_attestation_id(&env);
        let issued_at = env.ledger().timestamp();

        let attestation = Attestation {
            id: attestation_id,
            issuer: issuer.clone(),
            subject: subject.clone(),
            kind,
            label,
            metadata_cid,
            issued_at,
            expires_at,
            revoked: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.storage().persistent().extend_ttl(
            &DataKey::Attestation(attestation_id),
            5184000,
            5184000,
        );

        AttestationIssuedEvent {
            attestation_id,
            issuer,
            subject,
        }
        .publish(&env);

        Ok(attestation_id)
    }

    /// Get an attestation by id
    pub fn get_attestation(env: Env, attestation_id: u64) -> Result<Attestation, QuidError> {
        env.storage()
            .persistent()
            .get(&DataKey::Attestation(attestation_id))
            .ok_or(QuidError::AttestationNotFound)
    }

    /// Revoke an attestation
    pub fn revoke_attestation(env: Env, attestation_id: u64) -> Result<(), QuidError> {
        let mut attestation = Self::get_attestation(env.clone(), attestation_id)?;

        attestation.issuer.require_auth();

        if attestation.revoked {
            return Err(QuidError::AlreadyRevoked);
        }

        attestation.revoked = true;

        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.storage().persistent().extend_ttl(
            &DataKey::Attestation(attestation_id),
            5184000,
            5184000,
        );

        AttestationRevokedEvent { attestation_id }.publish(&env);

        Ok(())
    }

    // -------------------------------------------------------------------------
    // Public profile getter
    // -------------------------------------------------------------------------

    /// Fetch the reputation profile for `subject`.
    pub fn get_profile(env: Env, subject: Address) -> Result<Profile, QuidError> {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(subject))
            .ok_or(QuidError::ProfileNotFound)
    }

    // -------------------------------------------------------------------------
    // Profile Mutations
    // -------------------------------------------------------------------------

    /// Record a successful mission for `subject` and add `reward_amount` to their total earnings.
    pub fn increment_success(
        env: Env,
        subject: Address,
        reward_amount: i128,
    ) -> Result<(), QuidError> {
        let admin = Self::get_admin(env.clone())?;
        admin.require_auth();

        if reward_amount < 0 {
            return Err(QuidError::InvalidRewardAmount);
        }

        let mut profile = Self::load_or_default(&env, subject.clone());
        profile.successful_missions += 1;
        profile.total_earnings += reward_amount;
        profile.updated_at = env.ledger().timestamp();

        Self::store_profile(&env, &profile);

        env.events().publish(
            (
                soroban_sdk::symbol_short!("Profile"),
                soroban_sdk::symbol_short!("updated"),
            ),
            profile,
        );

        Ok(())
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    fn get_next_attestation_id(env: &Env) -> u64 {
        let current: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::AttestationCount)
            .unwrap_or(0);

        let next_id = current + 1;

        env.storage()
            .persistent()
            .set(&DataKey::AttestationCount, &next_id);

        env.storage()
            .persistent()
            .extend_ttl(&DataKey::AttestationCount, 5184000, 5184000);

        next_id
    }
}

#[allow(dead_code)]
impl QuidReputationContract {
    pub(crate) fn require_admin(env: &Env, caller: &Address) -> Result<(), QuidError> {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .ok_or(QuidError::AdminNotSet)?;

        admin.require_auth();

        if *caller != admin {
            return Err(QuidError::NotAuthorized);
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
                successful_missions: 0,
                missions_created: 0,
                total_earnings: 0,
                updated_at: env.ledger().timestamp(),
            })
    }
}

mod test;
