use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ReputationError {
    NotAuthorized = 1,
    ProfileNotFound = 2,
    InvalidInput = 3,
    AttestationNotFound = 4,
    AlreadyRevoked = 5,
    InvalidRewardAmount = 6,
}