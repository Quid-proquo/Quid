#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, String};

mod error;
mod types;

use error::QuidError;
use types::{Attestation, DataKey};

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
        // Only allow setting admin if not already set
        if env.storage().persistent().has(&DataKey::Admin) {
            return Err(QuidError::NotAuthorized);
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
        // Require issuer auth
        issuer.require_auth();

        // Validate label is not empty
        if label.is_empty() {
            return Err(QuidError::InvalidLabel);
        }

        // Validate expiry time if provided
        if let Some(expiry) = expires_at {
            let now = env.ledger().timestamp();
            if expiry <= now {
                return Err(QuidError::InvalidExpiryTime);
            }
        }

        // Get the next attestation id
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

        // Store the attestation

        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.storage().persistent().extend_ttl(
            &DataKey::Attestation(attestation_id),
            5184000,
            5184000,
        );

        // Publish AttestationIssuedEvent
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

        // Require issuer auth
        attestation.issuer.require_auth();

        // Check if already revoked
        if attestation.revoked {
            return Err(QuidError::AlreadyRevoked);
        }

        // Mark as revoked
        attestation.revoked = true;

        // Store updated attestation
        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.storage().persistent().extend_ttl(
            &DataKey::Attestation(attestation_id),
            5184000,
            5184000,
        );
        // Publish AttestationRevokedEvent
        AttestationRevokedEvent { attestation_id }.publish(&env);

        AttestationRevokedEvent { attestation_id }.publish(&env);
        Ok(())
    }

    /// Get the next attestation id (internal helper)
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
