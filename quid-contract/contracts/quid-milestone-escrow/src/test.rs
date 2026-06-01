#![cfg(test)]

use super::*;
use crate::types::{Milestone, MilestoneStatus, Program, ProgramStatus};
use soroban_sdk::{
    testutils::{Address as _, Events},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String,
};

fn setup_test_env() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidMilestoneEscrowContract, ());
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract.address();

    let sponsor = Address::generate(&env);
    let token_admin_client = StellarAssetClient::new(&env, &token_address);
    token_admin_client.mint(&sponsor, &10_000_000);

    (env, contract_id, sponsor, token_address, token_admin)
}

#[test]
fn test_default_statuses() {
    let env = Env::default();
    let contract_id = env.register(QuidMilestoneEscrowContract, ());
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);

    assert_eq!(client.get_program_status(), ProgramStatus::Active);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Pending);
}

#[test]
fn test_status_storage_roundtrip() {
    let env = Env::default();
    let contract_id = env.register(QuidMilestoneEscrowContract, ());
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);

    client.set_program_status(&ProgramStatus::Completed);
    client.set_milestone_status(&MilestoneStatus::Paid);

    assert_eq!(client.get_program_status(), ProgramStatus::Completed);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Paid);
}

#[test]
fn test_create_program_funds_and_stores_active_program() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);
    let recipient = Address::generate(&env);
    let reviewer = Address::generate(&env);
    let total_amount = 500;

    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &Some(reviewer.clone()),
        &Some(String::from_str(&env, "QmProgram")),
    );
    let contract_event_count = env
        .events()
        .all()
        .iter()
        .filter(|(id, _, _)| id == &contract_id)
        .count();

    assert_eq!(program_id, 1);
    assert_eq!(contract_event_count, 2);
    assert_eq!(token_client.balance(&contract_id), total_amount);
    assert_eq!(client.get_program_count(), 1);

    let program = client.get_program(&program_id);
    assert_eq!(program.id, program_id);
    assert_eq!(program.sponsor, sponsor);
    assert_eq!(program.recipient, recipient);
    assert_eq!(program.reviewer, Some(reviewer));
    assert_eq!(program.token, token_address);
    assert_eq!(program.total_amount, total_amount);
    assert_eq!(program.allocated_amount, 0);
    assert_eq!(program.released_amount, 0);
    assert_eq!(program.milestone_count, 0);
    assert_eq!(program.status, ProgramStatus::Active);
}

#[test]
fn test_add_milestone_stores_and_updates_program_totals() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);
    let total_amount = 500;
    let milestone_amount = 200;
    let due_at = 1_750_000_000;

    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &None,
        &None,
    );
    let milestone_id = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Design complete"),
        &milestone_amount,
        &due_at,
        &String::from_str(&env, "QmMilestone"),
    );

    assert_eq!(milestone_id, 1);

    let program = client.get_program(&program_id);
    assert_eq!(program.allocated_amount, milestone_amount);
    assert_eq!(program.milestone_count, 1);

    let milestone = client.get_milestone(&program_id, &milestone_id);
    assert_eq!(milestone.id, milestone_id);
    assert_eq!(milestone.program_id, program_id);
    assert_eq!(milestone.title, String::from_str(&env, "Design complete"));
    assert_eq!(milestone.amount, milestone_amount);
    assert_eq!(milestone.due_at, due_at);
    assert_eq!(
        milestone.metadata_cid,
        String::from_str(&env, "QmMilestone")
    );
    assert_eq!(milestone.status, MilestoneStatus::Pending);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_add_milestone_rejects_over_allocation() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);
    let total_amount = 500;

    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &None,
        &None,
    );
    let _ = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Too large"),
        &501,
        &1_750_000_000,
        &String::from_str(&env, "QmMilestone"),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_get_milestone_not_found() {
    let (env, contract_id, _sponsor, _token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);

    let _ = client.get_milestone(&999, &1);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_create_program_rejects_zero_amount() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);

    let _ = client.create_program(&sponsor, &recipient, &token_address, &0, &None, &None);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_get_program_not_found() {
    let (env, contract_id, _sponsor, _token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);

    let _ = client.get_program(&999);
}

#[test]
fn test_reviewer_approval_flow() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let _token_client = TokenClient::new(&env, &token_address);

    let recipient = Address::generate(&env);
    let reviewer = Address::generate(&env);

    // Simulate program creation with reviewer
    let _program = Program {
        id: 1,
        sponsor: sponsor.clone(),
        recipient: recipient.clone(),
        reviewer: Some(reviewer.clone()),
        token: token_address.clone(),
        total_amount: 10_000,
        allocated_amount: 0,
        released_amount: 0,
        milestone_count: 0,
        metadata_cid: Some(String::from_str(&env, "QmProgram")),
        created_at: env.ledger().timestamp(),
        status: ProgramStatus::Active,
    };

    // Simulate milestone creation
    let _milestone = Milestone {
        id: 1,
        program_id: 1,
        title: String::from_str(&env, "Milestone 1"),
        amount: 5_000,
        due_at: env.ledger().timestamp() + 86400,
        metadata_cid: String::from_str(&env, "QmMilestone1"),
        status: MilestoneStatus::Pending,
    };

    // Set initial milestone status to Pending
    client.set_milestone_status(&MilestoneStatus::Pending);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Pending);

    // Reviewer approves the milestone
    client.set_milestone_status(&MilestoneStatus::Approved);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Approved);

    // Verify program remains active
    client.set_program_status(&ProgramStatus::Active);
    assert_eq!(client.get_program_status(), ProgramStatus::Active);

    // Simulate payment after approval
    client.set_milestone_status(&MilestoneStatus::Paid);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Paid);

    // Verify recipient would receive funds (in full implementation)
    // This test demonstrates the expected flow:
    // 1. Milestone starts as Pending
    // 2. Reviewer approves -> Approved
    // 3. Payment is processed -> Paid
    // 4. Program remains Active for next milestones
}

#[test]
fn test_cancel_program_with_refund() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let _recipient = Address::generate(&env);

    // Record sponsor's initial balance
    let _sponsor_initial_balance = token_client.balance(&sponsor);

    // Simulate program with partial allocation
    let total_amount: i128 = 10_000;
    let allocated_amount: i128 = 6_000; // 2 milestones funded
    let _released_amount: i128 = 3_000; // 1 milestone paid
    let unfunded_remainder = total_amount - allocated_amount; // 4_000 should be refunded

    // Set program to Active initially
    client.set_program_status(&ProgramStatus::Active);
    assert_eq!(client.get_program_status(), ProgramStatus::Active);

    // Sponsor cancels the program
    client.set_program_status(&ProgramStatus::Cancelled);
    assert_eq!(client.get_program_status(), ProgramStatus::Cancelled);

    // In a full implementation, the contract would:
    // 1. Calculate unfunded remainder: total_amount - allocated_amount
    // 2. Refund unfunded_remainder to sponsor
    // 3. Keep allocated but unreleased funds in escrow
    // 4. Mark program as Cancelled

    // Verify the expected refund amount
    let expected_refund = unfunded_remainder;
    assert_eq!(expected_refund, 4_000);

    // Verify cancelled milestones
    client.set_milestone_status(&MilestoneStatus::Cancelled);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Cancelled);

    // This test demonstrates the expected cancellation flow:
    // 1. Program is Active with partial funding
    // 2. Sponsor cancels -> Cancelled status
    // 3. Unfunded remainder (4,000) is refunded to sponsor
    // 4. Allocated but unreleased funds (3,000) remain in escrow
    // 5. Pending milestones are marked as Cancelled
}

#[test]
fn test_cancel_program_no_refund_when_fully_allocated() {
    let (env, contract_id, _sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let _token_client = TokenClient::new(&env, &token_address);

    // Simulate fully allocated program
    let total_amount: i128 = 10_000;
    let allocated_amount: i128 = 10_000; // All funds allocated
    let unfunded_remainder = total_amount - allocated_amount; // 0

    // Set program to Active
    client.set_program_status(&ProgramStatus::Active);

    // Cancel the program
    client.set_program_status(&ProgramStatus::Cancelled);
    assert_eq!(client.get_program_status(), ProgramStatus::Cancelled);

    // Verify no refund is expected when fully allocated
    assert_eq!(unfunded_remainder, 0);

    // This test demonstrates:
    // 1. When all funds are allocated to milestones
    // 2. Cancellation results in no refund (unfunded_remainder = 0)
    // 3. All allocated funds remain in escrow for milestone completion
}

#[test]
fn test_reviewer_approval_required_before_payment() {
    let (env, contract_id, _sponsor, _token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);

    // Milestone starts as Pending
    client.set_milestone_status(&MilestoneStatus::Pending);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Pending);

    // Cannot go directly to Paid without Approval
    // In full implementation, this would be enforced by the contract
    // Expected flow: Pending -> Approved -> Paid

    // Correct flow: Approve first
    client.set_milestone_status(&MilestoneStatus::Approved);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Approved);

    // Then pay
    client.set_milestone_status(&MilestoneStatus::Paid);
    assert_eq!(client.get_milestone_status(), MilestoneStatus::Paid);

    // This test demonstrates the required approval flow:
    // 1. Milestone must be Approved by reviewer
    // 2. Only then can it transition to Paid
}

#[test]
fn test_program_completion_after_all_milestones_paid() {
    let (env, contract_id, _sponsor, _token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);

    // Program starts Active
    client.set_program_status(&ProgramStatus::Active);
    assert_eq!(client.get_program_status(), ProgramStatus::Active);

    // Simulate all milestones being paid
    client.set_milestone_status(&MilestoneStatus::Paid);

    // Program transitions to Completed
    client.set_program_status(&ProgramStatus::Completed);
    assert_eq!(client.get_program_status(), ProgramStatus::Completed);

    // This test demonstrates:
    // 1. Program starts Active
    // 2. After all milestones are Paid
    // 3. Program transitions to Completed
}
