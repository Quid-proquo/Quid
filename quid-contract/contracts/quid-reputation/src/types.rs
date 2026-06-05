use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Attestation {
    pub id: u64,
    pub issuer: Address,
    pub subject: Address,
    pub kind: String,
    pub label: String,
    pub metadata_cid: Option<String>,
    pub issued_at: u64,
    pub expires_at: Option<u64>,
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
    /// Total number of successful missions.
    pub successful_missions: u32,
    /// Total number of missions created (for creators).
    pub missions_created: u32,
    /// Total earnings from completed missions.
    pub total_earnings: i128,
    /// Last updated timestamp.
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Attestation(u64),
    AttestationCount,
    Admin,
    /// Per-subject reputation profile.
    Profile(Address),
}

#[contracttype]
pub enum AttestationKind {
    Contributor,
    Expert,
    Reviewer,
}
