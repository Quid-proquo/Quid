use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum QuidError {
    NotAuthorized = 1,
    ProfileNotFound = 2,
    AdminAlreadySet = 3,
    InvalidScore = 4,
    AttestationNotFound = 5,
    InvalidExpiryTime = 6,
    AlreadyRevoked = 7,
    AdminNotSet = 8,
    InvalidLabel = 9,
    InvalidRewardAmount = 10,
}