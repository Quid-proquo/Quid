use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MilestoneEscrowError {
    InvalidState = 1,
    InvalidAmount = 2,
    ProgramNotFound = 3,
    MilestoneNotFound = 4,
}
