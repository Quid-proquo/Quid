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
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    pub subject: Address,
    pub successful_missions: u32,
    pub rejected_submissions: u32,
    pub reviewer_score: i64,
    pub founder_score: i64,
    pub total_earnings: i128,
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Profile(Address),
    Attestation(u64),
    AttestationCount,
}
