use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ReputationError {
    NotAuthorized = 1,
    InvalidInput = 2,
    AlreadyRevoked = 3,
    AttestationNotFound = 4,
    ProfileNotFound = 5,
}
