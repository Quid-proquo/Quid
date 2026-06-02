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
#[contracttype]
pub enum DataKey {
    Attestation(u64),
    AttestationCount,
    Admin,

}

#[contracttype]
pub enum AttestationKind {
    Contributor,
    Expert,
    Reviewer,

}
