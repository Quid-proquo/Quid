use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MilestoneEscrowError {
    ProgramNotFound = 1,
    MilestoneNotFound = 2,
    InvalidAmount = 3,
    NotAuthorized = 4,
    ProgramClosed = 5,
    AmountExceedsEscrow = 6,
    MilestoneNotPending = 7,
}
