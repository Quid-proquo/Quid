use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum OracleError {
    /// initialize() has already been called; the oracle key is immutable
    AlreadyInitialized = 1,
    /// publish_score was called before initialize()
    NotInitialized = 2,
    /// caller is not the configured oracle key
    NotOracle = 3,
    /// score is greater than MAX_SCORE (100)
    InvalidScore = 4,
    /// model_cid must be a non-empty IPFS CID
    InvalidModelCid = 5,
}
