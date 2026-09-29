use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum QuidError {
    MissionNotFound = 1,
    MissionClosed = 2,
    MissionFull = 3,
    AlreadySubmitted = 4,
    InsufficientFunds = 5,
    NotAuthorized = 6,
    NegativeReward = 7,
    InvalidState = 8,
    AlreadyPaid = 9,
    MissionNotOpen = 10,
    SubmissionNotFound = 11,
    NotPending = 12,
    InvalidAmount = 13,
    TreasuryNotSet = 14,
    StakeNotFound = 15,
    InsufficientAssetBalance = 16,
    FeeCollectorNotSet = 17,
    StakingPoolNotSet = 18,
    /// `expires_at` is at or before the current ledger timestamp.
    ExpiryInThePast = 19,
    /// The mission's deadline has passed: no new submissions are accepted.
    MissionExpired = 20,
    /// `expire_mission` was called before the mission's deadline.
    MissionNotExpired = 21,
    ReputationNotSet = 22,
}
