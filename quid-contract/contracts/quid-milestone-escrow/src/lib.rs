#![no_std]
use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env};

mod error;
use error::MilestoneEscrowError;

#[contracttype]
pub enum ProgramStatus {
    Active,
    Completed,
    Cancelled,
}

#[contracttype]
pub enum DataKey {
    Program(u64),
    Milestone(u64, u32),
}

#[contracttype]
pub struct Program {
    pub id: u64,
    pub owner: Address,
    pub status: ProgramStatus,
    pub escrow_balance: i128,
}

#[contracttype]
pub struct Milestone {
    pub program_id: u64,
    pub milestone_id: u32,
    pub amount: i128,
    pub pending: bool,
}

#[contractevent(topics = ["program", "created"])]
pub struct ProgramCreatedEvent {
    pub program_id: u64,
    pub owner: Address,
}

#[contractevent(topics = ["milestone", "added"])]
pub struct MilestoneAddedEvent {
    pub program_id: u64,
    pub milestone_id: u32,
    pub amount: i128,
}

#[contractevent(topics = ["milestone", "paid"])]
pub struct MilestonePaidEvent {
    pub program_id: u64,
    pub milestone_id: u32,
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
}

#[contractevent(topics = ["program", "cancelled"])]
pub struct ProgramCancelledEvent {
    pub program_id: u64,
    pub cancelled_by: Address,
}

#[contractevent(topics = ["program", "status_changed"])]
pub struct ProgramStatusChangedEvent {
    pub program_id: u64,
    pub old_status: ProgramStatus,
    pub new_status: ProgramStatus,
}

#[contract]
pub struct MilestoneEscrowContract;

#[contractimpl]
impl MilestoneEscrowContract {
    pub fn create_program(
        env: Env,
        owner: Address,
        program_id: u64,
        initial_escrow: i128,
    ) -> Result<u64, MilestoneEscrowError> {
        owner.require_auth();

        if initial_escrow <= 0 {
            return Err(MilestoneEscrowError::InvalidAmount);
        }

        let program = Program {
            id: program_id,
            owner: owner.clone(),
            status: ProgramStatus::Active,
            escrow_balance: initial_escrow,
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

        Ok(())
    }

    pub fn pay_milestone(
        env: Env,
        payer: Address,
        program_id: u64,
        milestone_id: u32,
        payee: Address,
        amount: i128,
    ) -> Result<(), MilestoneEscrowError> {
        payer.require_auth();

        let mut program: Program = env
            .storage()
            .persistent()
            .get(&DataKey::Program(program_id))
            .ok_or(MilestoneEscrowError::ProgramNotFound)?;

        if program.status != ProgramStatus::Active {
            return Err(MilestoneEscrowError::ProgramClosed);
        }

        let mut milestone: Milestone = env
            .storage()
            .persistent()
            .get(&DataKey::Milestone(program_id, milestone_id))
            .ok_or(MilestoneEscrowError::MilestoneNotFound)?;

        if !milestone.pending {
            return Err(MilestoneEscrowError::MilestoneNotPending);
        }
        if amount != milestone.amount {
            return Err(MilestoneEscrowError::InvalidAmount);
        }
        if amount > program.escrow_balance {
            return Err(MilestoneEscrowError::AmountExceedsEscrow);
        }

        milestone.pending = false;
        program.escrow_balance -= amount;

        env.storage()
            .persistent()
            .set(&DataKey::Milestone(program_id, milestone_id), &milestone);
        env.storage()
            .persistent()
            .set(&DataKey::Program(program_id), &program);

        MilestonePaidEvent {
            program_id,
            milestone_id,
            payer: payer.clone(),
            payee: payee.clone(),
            amount,
        }
        .publish(&env);

        Ok(())
    }

    pub fn cancel_program(
        env: Env,
        owner: Address,
        program_id: u64,
    ) -> Result<(), MilestoneEscrowError> {
        owner.require_auth();

        let mut program: Program = env
            .storage()
            .persistent()
            .get(&DataKey::Program(program_id))
            .ok_or(MilestoneEscrowError::ProgramNotFound)?;

        if program.owner != owner {
            return Err(MilestoneEscrowError::NotAuthorized);
        }
        if program.status != ProgramStatus::Active {
            return Err(MilestoneEscrowError::ProgramClosed);
        }

        program.status = ProgramStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Program(program_id), &program);

        ProgramCancelledEvent {
            program_id,
            cancelled_by: owner,
        }
        .publish(&env);

        Ok(())
    }

    pub fn change_program_status(
        env: Env,
        owner: Address,
        program_id: u64,
        new_status: ProgramStatus,
    ) -> Result<(), MilestoneEscrowError> {
        owner.require_auth();

        let mut program: Program = env
            .storage()
            .persistent()
            .get(&DataKey::Program(program_id))
            .ok_or(MilestoneEscrowError::ProgramNotFound)?;

        if program.owner != owner {
            return Err(MilestoneEscrowError::NotAuthorized);
        }
        if program.status == ProgramStatus::Cancelled && new_status != ProgramStatus::Cancelled {
            return Err(MilestoneEscrowError::ProgramClosed);
        }

        let old_status = program.status;
        program.status = new_status;
        env.storage()
            .persistent()
            .set(&DataKey::Program(program_id), &program);

        ProgramStatusChangedEvent {
            program_id,
            old_status,
            new_status: program.status,
        }
        .publish(&env);

        Ok(())
    }
}
