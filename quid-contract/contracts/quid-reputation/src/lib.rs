#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod error;
mod types;

use error::ReputationError;
use types::{DataKey, Profile};

/// TTL extension applied to every profile write (roughly 60 days in ledgers).
#[allow(dead_code)]
const PROFILE_TTL_LEDGERS: u32 = 5_184_000;

#[contract]
pub struct QuidReputationContract;

#[contractimpl]
impl QuidReputationContract {
    // -------------------------------------------------------------------------
    // Admin bootstrap
    // -------------------------------------------------------------------------

    /// Bootstrap the contract admin.  May only be called once; subsequent calls
    /// require the existing admin to authorise the change.
    pub fn set_admin(env: Env, new_admin: Address) -> Result<(), ReputationError> {
        if let Some(current_admin) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::Admin)
        {
            // Admin already set – only the current admin may rotate it.
            current_admin.require_auth();
        } else {
            // First-time bootstrap – require the new admin to sign.
            new_admin.require_auth();
        }

        env.storage().instance().set(&DataKey::Admin, &new_admin);

        Ok(())
    }

    /// Return the current admin address.
    pub fn get_admin(env: Env) -> Result<Address, ReputationError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::AdminNotSet)
    }

    // -------------------------------------------------------------------------
    // Public profile getter
    // -------------------------------------------------------------------------

    /// Fetch the reputation profile for `subject`.
    /// Returns `ProfileNotFound` when no profile has been stored yet.
    pub fn get_profile(env: Env, subject: Address) -> Result<Profile, ReputationError> {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(subject))
            .ok_or(ReputationError::ProfileNotFound)
    }
}

// -------------------------------------------------------------------------
// Internal helpers (used by every profile mutation path)
// -------------------------------------------------------------------------

#[allow(dead_code)]
impl QuidReputationContract {
    /// Require that `caller` is the bootstrapped admin.
    /// Panics (via `require_auth`) if the caller is not the admin, and returns
    /// `AdminNotSet` if no admin has been bootstrapped yet.
    pub(crate) fn require_admin(env: &Env, caller: &Address) -> Result<(), ReputationError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::AdminNotSet)?;

        admin.require_auth();

        // Ensure the supplied caller matches the stored admin.
        if *caller != admin {
            return Err(ReputationError::NotAdmin);
        }

        Ok(())
    }

    /// Persist `profile` to persistent storage and extend its TTL.
    pub(crate) fn store_profile(env: &Env, profile: &Profile) {
        let key = DataKey::Profile(profile.subject.clone());
        env.storage().persistent().set(&key, profile);
        env.storage()
            .persistent()
            .extend_ttl(&key, PROFILE_TTL_LEDGERS, PROFILE_TTL_LEDGERS);
    }

    /// Load the profile for `subject`, returning a zeroed default when none
    /// exists yet.  Mutation methods should call this instead of `get_profile`
    /// so that a missing profile is treated as a fresh slate rather than an
    /// error.
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
