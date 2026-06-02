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

#[contractevent(topics = ["milestone", "paid"])]
pub struct MilestonePaidEvent {
    pub program_id: u64,
    pub milestone_id: u64,
    pub amount: i128,
    pub recipient: Address,
}

#[contractevent(topics = ["program", "cancelled"])]
pub struct ProgramCancelledEvent {
    pub program_id: u64,
    pub sponsor: Address,
    pub refund_amount: i128,
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

    pub fn approve_milestone(
        env: Env,
        program_id: u64,
        milestone_id: u64,
        approver: Address,
    ) -> Result<(), MilestoneEscrowError> {
        approver.require_auth();

        let mut program = Self::get_program(env.clone(), program_id)?;

        // #181 – authorize sponsor or optional reviewer without consuming the Option
        let is_sponsor = approver == program.sponsor;
        let is_reviewer = program.reviewer.as_ref() == Some(&approver);
        if !is_sponsor && !is_reviewer {
            return Err(MilestoneEscrowError::NotAuthorized);
        }

        // #182 – reject non-active programs
        if program.status != ProgramStatus::Active {
            return Err(MilestoneEscrowError::InvalidState);
        }

        // Reject milestones not in Pending status
        let mut milestone = Self::get_milestone(env.clone(), program_id, milestone_id)?;
        if milestone.status != MilestoneStatus::Pending {
            return Err(MilestoneEscrowError::InvalidState);
        }

        // Transfer milestone funds from contract to recipient
        token::Client::new(&env, &program.token).transfer(
            &env.current_contract_address(),
            &program.recipient,
            &milestone.amount,
        );

        // Mark the milestone as Paid and persist
        let paid_amount = milestone.amount;
        milestone.status = MilestoneStatus::Paid;
        env.storage()
            .persistent()
            .set(&DataKey::Milestone(program_id, milestone_id), &milestone);

        // Increase released_amount
        program.released_amount = program
            .released_amount
            .checked_add(paid_amount)
            .ok_or(MilestoneEscrowError::InvalidAmount)?;

        let recipient = program.recipient.clone();

        MilestonePaidEvent {
            program_id,
            milestone_id,
            amount: paid_amount,
            recipient,
        }
        .publish(&env);

        // If all funds are released, move the program to Completed
        if program.released_amount >= program.total_amount {
            program.status = ProgramStatus::Completed;
            ProgramStatusChangedEvent {
                program_id,
                status: ProgramStatus::Completed,
            }
            .publish(&env);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Program(program_id), &program);

        Ok(())
    }

    pub fn cancel_program(
        env: Env,
        program_id: u64,
        sponsor: Address,
    ) -> Result<(), MilestoneEscrowError> {
        sponsor.require_auth();

        let mut program = Self::get_program(env.clone(), program_id)?;

        // #183 – only the program sponsor may cancel
        if sponsor != program.sponsor {
            return Err(MilestoneEscrowError::NotAuthorized);
        }

        // Reject non-active programs
        if program.status != ProgramStatus::Active {
            return Err(MilestoneEscrowError::InvalidState);
        }

        // Refund total_amount - released_amount from contract to sponsor
        let refund_amount = program.total_amount - program.released_amount;
        if refund_amount > 0 {
            token::Client::new(&env, &program.token).transfer(
                &env.current_contract_address(),
                &program.sponsor,
                &refund_amount,
            );
        }

        // Mark the program as Cancelled and persist
        program.status = ProgramStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Program(program_id), &program);

        ProgramCancelledEvent {
            program_id,
            sponsor: program.sponsor.clone(),
            refund_amount,
        }
        .publish(&env);

        ProgramStatusChangedEvent {
            program_id,
            status: ProgramStatus::Cancelled,
        }
        .publish(&env);

        Ok(())
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
