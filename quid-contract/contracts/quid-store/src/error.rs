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
}
