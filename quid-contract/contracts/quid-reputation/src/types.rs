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

#[contracttype]
pub enum DataKey {
    Attestation(u64),
    AttestationCount,
    Admin,
}
