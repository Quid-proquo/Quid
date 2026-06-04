use soroban_sdk::{contracttype, Address};

/// On-chain reputation profile for a single user address.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationProfile {
    /// The wallet this profile belongs to.
    pub owner: Address,
    /// Number of successfully completed missions / approved submissions.
    pub success_count: u32,
    /// Number of rejected submissions.
    pub rejection_count: u32,
    /// Ledger timestamp of the last mutation.
    pub last_updated: u64,
}

/// Storage keys used by the reputation contract.
#[contracttype]
pub enum DataKey {
    /// Admin address that is allowed to mutate profiles.
    Admin,
    /// Per-user reputation profile, keyed by wallet address.
    Profile(Address),
use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Attestation {
    pub id: u64,
    pub issuer: Address,
    pub subject: Address,
    pub attestation_type: String,
    pub data_cid: String,
    pub issued_at: u64,
    pub revoked: bool,
}

/// On-chain reputation profile for a single subject address.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    /// The address this profile belongs to.
    pub subject: Address,
    /// Cumulative reputation score (starts at 0).
    pub score: i64,
    /// Total number of completed missions.
    pub missions_completed: u32,
    /// Total number of missions created (for creators).
    pub missions_created: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    /// Per-subject reputation profile.
    Profile(Address),
    Attestation(u64),
    AttestationCount,
}
