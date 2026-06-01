use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ReputationError {
    NotAuthorized = 1,
    AttestationNotFound = 2,
    AlreadyRevoked = 3,
    InvalidInput = 4,
}
