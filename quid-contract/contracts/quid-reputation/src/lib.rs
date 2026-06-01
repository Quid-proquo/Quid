#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String};

mod error;
mod types;

use error::ReputationError;
use types::{Attestation, DataKey};

#[contract]
pub struct QuidReputationContract;

#[contractimpl]
impl QuidReputationContract {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) -> Result<(), ReputationError> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ReputationError::InvalidInput);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Get the admin address
    pub fn get_admin(env: Env) -> Result<Address, ReputationError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotAuthorized)
    }

    /// Issue a new attestation
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
            5184000,
            5184000,
        );

        Ok(attestation_id)
    }

    /// Get an attestation by ID
    pub fn get_attestation(env: Env, attestation_id: u64) -> Result<Attestation, ReputationError> {
        env.storage()
            .persistent()
            .get(&DataKey::Attestation(attestation_id))
            .ok_or(ReputationError::AttestationNotFound)
    }

    /// Revoke an attestation (issuer or admin only)
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

        // Allow revocation by the original issuer or the contract admin
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
            5184000,
            5184000,
        );

        Ok(())
    }

    /// Get the total number of attestations
    pub fn get_attestation_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::AttestationCount)
            .unwrap_or(0)
    }

    /// Check if an attestation exists
    pub fn attestation_exists(env: Env, attestation_id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Attestation(attestation_id))
    }

    // Private helper function to get the next attestation ID
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

mod test;
