use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ReputationError {
    NotAuthorized = 1,
    AttestationNotFound = 2,
    AlreadyRevoked = 3,
    InvalidInput = 4,
    /// No profile exists for the given subject address.
    ProfileNotFound = 5,
    /// Admin address has not been set in the contract.
    AdminNotSet = 6,
    /// Invalid amount provided for the operation.
    InvalidAmount = 7,
}
