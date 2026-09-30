use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    /// The single authorized oracle key
    Oracle,
    /// Published score for a (mission, hunter) pair
    Score(u64, Address),
    /// Number of times a (mission, hunter) pair has been scored
    Revision(u64, Address),
}

/// A quality / sentiment score published by the off-chain oracle and bound to
/// the IPFS CID of the submission it was computed from.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QualityScore {
    /// Mission the score belongs to
    pub mission_id: u64,
    /// Hunter the score describes
    pub hunter: Address,
    /// Score on a 0-100 scale
    pub score: u32,
    /// IPFS CID of the model / prompt that produced the score
    pub model_cid: String,
    /// 1 for the first score, incremented on each oracle republication
    pub revision: u32,
    /// Ledger timestamp of the publication
    pub updated_at: u64,
}
