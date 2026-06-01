#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, token, Address, Env, String};

mod error;
pub mod types;

use error::MilestoneEscrowError;
use types::{DataKey, Milestone, MilestoneStatus, Program, ProgramStatus};

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

#[contractevent(topics = ["milestone", "added"])]
pub struct MilestoneAddedEvent {
    pub program_id: u64,
    pub milestone_id: u64,
    pub amount: i128,
}

#[contract]
pub struct QuidMilestoneEscrowContract;

#[contractimpl]
impl QuidMilestoneEscrowContract {
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

    pub fn add_milestone(
        env: Env,
        program_id: u64,
        title: String,
        amount: i128,
        due_at: u64,
        metadata_cid: String,
    ) -> Result<u64, MilestoneEscrowError> {
        let mut program = Self::get_program(env.clone(), program_id)?;
        program.sponsor.require_auth();

        if program.status != ProgramStatus::Active {
            return Err(MilestoneEscrowError::InvalidState);
        }

        if amount <= 0 {
            return Err(MilestoneEscrowError::InvalidAmount);
        }

        let allocated_amount = program
            .allocated_amount
            .checked_add(amount)
            .ok_or(MilestoneEscrowError::InvalidAmount)?;
        if allocated_amount > program.total_amount {
            return Err(MilestoneEscrowError::InvalidAmount);
        }

        let milestone_id = program.milestone_count + 1;
        let milestone = Milestone {
            id: milestone_id,
            program_id,
            title,
            amount,
            due_at,
            metadata_cid,
            status: MilestoneStatus::Pending,
        };

        program.allocated_amount = allocated_amount;
        program.milestone_count = milestone_id;

        env.storage()
            .persistent()
            .set(&DataKey::Milestone(program_id, milestone_id), &milestone);
        env.storage()
            .persistent()
            .set(&DataKey::Program(program_id), &program);

        MilestoneAddedEvent {
            program_id,
            milestone_id,
            amount,
        }
        .publish(&env);

        Ok(milestone_id)
    }

    pub fn get_milestone(
        env: Env,
        program_id: u64,
        milestone_id: u64,
    ) -> Result<Milestone, MilestoneEscrowError> {
        env.storage()
            .persistent()
            .get(&DataKey::Milestone(program_id, milestone_id))
            .ok_or(MilestoneEscrowError::MilestoneNotFound)
    }

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
}

mod test;
