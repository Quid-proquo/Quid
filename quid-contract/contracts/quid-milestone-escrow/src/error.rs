use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MilestoneEscrowError {
    InvalidState = 1,
<<<<<<< HEAD
=======
    InvalidAmount = 2,
    ProgramNotFound = 3,
>>>>>>> f0c6f47 (feat(contracts): implement upsert profile)
}
