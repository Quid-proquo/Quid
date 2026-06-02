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
    Profile(Address),
    Attestation(u64),
    AttestationCount,
    Admin,
    /// Per-subject reputation profile.
    Profile(Address),
}
