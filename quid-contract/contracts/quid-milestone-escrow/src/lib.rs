#![no_std]

<<<<<<< HEAD
use soroban_sdk::{contract, contractimpl, Env};
=======
use soroban_sdk::{contract, contractevent, contractimpl, token, Address, Env, String};
>>>>>>> f0c6f47 (feat(contracts): implement upsert profile)

mod error;
pub mod types;

<<<<<<< HEAD
use types::{DataKey, MilestoneStatus, ProgramStatus};
=======
use error::MilestoneEscrowError;
use types::{DataKey, MilestoneStatus, Program, ProgramStatus};

#[contractevent(topics = ["program", "created"])]
pub struct ProgramCreatedEvent {
    pub program_id: u64,
    pub sponsor: Address,
    pub recipient: Address,
}

#[contractevent(topics = ["program", "status_changed"])]
pub struct ProgramStatusChangedEvent {
    pub program_id: u64,
    pub status: ProgramStatus,
}
>>>>>>> f0c6f47 (feat(contracts): implement upsert profile)

#[contract]
pub struct QuidMilestoneEscrowContract;

#[contractimpl]
impl QuidMilestoneEscrowContract {
<<<<<<< HEAD
=======
    pub fn create_program(
        env: Env,
        sponsor: Address,
        recipient: Address,
        token: Address,
        total_amount: i128,
        reviewer: Option<Address>,
        metadata_cid: Option<String>,
    ) -> Result<u64, MilestoneEscrowError> {
        sponsor.require_auth();

        if total_amount <= 0 {
            return Err(MilestoneEscrowError::InvalidAmount);
        }

        token::Client::new(&env, &token).transfer(
            &sponsor,
            env.current_contract_address(),
            &total_amount,
        );

        let program_id = Self::get_next_program_id(&env);
        let status = ProgramStatus::Active;
        let program = Program {
            id: program_id,
            sponsor: sponsor.clone(),
            recipient: recipient.clone(),
            reviewer,
            token,
            total_amount,
            allocated_amount: 0,
            released_amount: 0,
            milestone_count: 0,
            metadata_cid,
            created_at: env.ledger().timestamp(),
            status,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Program(program_id), &program);

        ProgramCreatedEvent {
            program_id,
            sponsor,
            recipient,
        }
        .publish(&env);
        ProgramStatusChangedEvent { program_id, status }.publish(&env);

        Ok(program_id)
    }

    pub fn get_program(env: Env, program_id: u64) -> Result<Program, MilestoneEscrowError> {
        env.storage()
            .persistent()
            .get(&DataKey::Program(program_id))
            .ok_or(MilestoneEscrowError::ProgramNotFound)
    }

>>>>>>> f0c6f47 (feat(contracts): implement upsert profile)
    pub fn get_program_status(env: Env) -> ProgramStatus {
        env.storage()
            .persistent()
            .get(&DataKey::ProgramStatus)
            .unwrap_or_default()
    }

    pub fn set_program_status(env: Env, status: ProgramStatus) {
        env.storage()
            .persistent()
            .set(&DataKey::ProgramStatus, &status);
    }

    pub fn get_milestone_status(env: Env) -> MilestoneStatus {
        env.storage()
            .persistent()
            .get(&DataKey::MilestoneStatus)
            .unwrap_or_default()
    }

    pub fn set_milestone_status(env: Env, status: MilestoneStatus) {
        env.storage()
            .persistent()
            .set(&DataKey::MilestoneStatus, &status);
    }
<<<<<<< HEAD
=======

    pub fn get_program_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ProgramCount)
            .unwrap_or(0)
    }

    fn get_next_program_id(env: &Env) -> u64 {
        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ProgramCount)
            .unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::ProgramCount, &count);
        count
    }
>>>>>>> f0c6f47 (feat(contracts): implement upsert profile)
}

mod test;
