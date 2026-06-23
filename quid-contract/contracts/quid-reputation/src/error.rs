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
    /// No admin has been bootstrapped yet.
    AdminNotSet = 6,
}
