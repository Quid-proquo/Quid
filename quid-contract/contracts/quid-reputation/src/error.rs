use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ReputationError {
    NotAuthorized = 1,
    ProfileNotFound = 2,
    InvalidEarnings = 3,
    InvalidScore = 4,
}
