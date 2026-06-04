use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]

pub enum QuidError {
    NotAuthorized = 1,
    ProfileNotFound = 2,
    AdminAlreadySet = 3,
    InvalidScore = 4,
    AttestationNotFound = 2,
    InvalidExpiryTime = 3,
    AlreadyRevoked = 4,
    AdminNotSet = 5,
    InvalidLabel = 6,
}
