#![cfg(test)]

use super::*;
use crate::types::{MilestoneStatus, ProgramStatus};
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
fn test_approve_milestone_by_sponsor() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);
    let recipient = Address::generate(&env);
    let total_amount = 1_000_i128;
    let milestone_amount = 400_i128;

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
        &String::from_str(&env, "Phase 1"),
        &milestone_amount,
        &1_750_000_000,
        &String::from_str(&env, "QmM1"),
    );

    client.approve_milestone(&program_id, &milestone_id, &sponsor);

    let milestone = client.get_milestone(&program_id, &milestone_id);
    assert_eq!(milestone.status, MilestoneStatus::Paid);

    let program = client.get_program(&program_id);
    assert_eq!(program.released_amount, milestone_amount);
    assert_eq!(program.status, ProgramStatus::Active);
    assert_eq!(token_client.balance(&recipient), milestone_amount);
}

#[test]
fn test_cancel_program_refunds_unreleased_funds() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);
    let recipient = Address::generate(&env);
    let total_amount = 1_000_i128;
    let milestone_amount = 300_i128;

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
        &String::from_str(&env, "Phase 1"),
        &milestone_amount,
        &1_750_000_000,
        &String::from_str(&env, "QmM1"),
    );
    // Pay out one milestone so released_amount = 300
    client.approve_milestone(&program_id, &milestone_id, &sponsor);

    let sponsor_balance_before = token_client.balance(&sponsor);
    client.cancel_program(&program_id, &sponsor);

    let program = client.get_program(&program_id);
    assert_eq!(program.status, ProgramStatus::Cancelled);

    // Refund = total_amount - released_amount = 1000 - 300 = 700
    let expected_refund = total_amount - milestone_amount;
    assert_eq!(
        token_client.balance(&sponsor),
        sponsor_balance_before + expected_refund
    );
}

#[test]
fn test_approve_milestone_by_reviewer() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);
    let recipient = Address::generate(&env);
    let reviewer = Address::generate(&env);
    let total_amount = 1_000_i128;
    let milestone_amount = 400_i128;

    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &Some(reviewer.clone()),
        &None,
    );
    let milestone_id = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Phase 1"),
        &milestone_amount,
        &1_750_000_000,
        &String::from_str(&env, "QmM1"),
    );

    // Reviewer (not sponsor) approves the milestone
    client.approve_milestone(&program_id, &milestone_id, &reviewer);

    let milestone = client.get_milestone(&program_id, &milestone_id);
    assert_eq!(milestone.status, MilestoneStatus::Paid);
    assert_eq!(token_client.balance(&recipient), milestone_amount);

    // Reviewer is still stored (not consumed)
    let program = client.get_program(&program_id);
    assert_eq!(program.reviewer, Some(reviewer));
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_approve_milestone_unauthorized_fails() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);
    let intruder = Address::generate(&env);

    let program_id =
        client.create_program(&sponsor, &recipient, &token_address, &1_000, &None, &None);
    let milestone_id = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Phase 1"),
        &400,
        &1_750_000_000,
        &String::from_str(&env, "QmM1"),
    );

    // Intruder is neither sponsor nor reviewer – must be rejected
    client.approve_milestone(&program_id, &milestone_id, &intruder);
}

#[test]
fn test_approve_milestone_completes_program() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);
    let total_amount = 500_i128;

    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &None,
        &None,
    );
    // Single milestone covering the full funded amount
    let milestone_id = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Full work"),
        &total_amount,
        &1_750_000_000,
        &String::from_str(&env, "QmM1"),
    );

    client.approve_milestone(&program_id, &milestone_id, &sponsor);

    let program = client.get_program(&program_id);
    assert_eq!(program.released_amount, total_amount);
    assert_eq!(program.status, ProgramStatus::Completed);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_cancel_program_non_active_fails() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);

    let program_id =
        client.create_program(&sponsor, &recipient, &token_address, &500, &None, &None);
    client.cancel_program(&program_id, &sponsor);
    // Second cancel on a Cancelled program must fail with InvalidState
    client.cancel_program(&program_id, &sponsor);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_cancel_program_unauthorized_fails() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);
    let intruder = Address::generate(&env);

    let program_id =
        client.create_program(&sponsor, &recipient, &token_address, &500, &None, &None);
    // Intruder is not the sponsor – must be rejected
    client.cancel_program(&program_id, &intruder);
}

// ── Issue #184: Milestone escrow happy path tests ──────────────────────────

/// Full end-to-end happy path:
/// fund program → add two milestones → sponsor approves both → program completes.
#[test]
fn test_happy_path_two_milestones_full_release() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);
    let recipient = Address::generate(&env);

    let total_amount = 1_000_i128;
    let amount_m1 = 600_i128;
    let amount_m2 = 400_i128;

    // ── 1. Create funded program ──────────────────────────────────────────
    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &None,
        &Some(String::from_str(&env, "QmProgram")),
    );

    let program = client.get_program(&program_id);
    assert_eq!(program.status, ProgramStatus::Active);
    assert_eq!(program.total_amount, total_amount);
    assert_eq!(program.released_amount, 0);
    assert_eq!(token_client.balance(&contract_id), total_amount);

    // ── 2. Add two milestones ─────────────────────────────────────────────
    let m1 = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Milestone 1"),
        &amount_m1,
        &1_750_000_000,
        &String::from_str(&env, "QmM1"),
    );
    let m2 = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Milestone 2"),
        &amount_m2,
        &1_750_086_400,
        &String::from_str(&env, "QmM2"),
    );

    let program = client.get_program(&program_id);
    assert_eq!(program.allocated_amount, total_amount);
    assert_eq!(program.milestone_count, 2);

    // ── 3. Approve milestone 1 ────────────────────────────────────────────
    client.approve_milestone(&program_id, &m1, &sponsor);

    assert_eq!(
        client.get_milestone(&program_id, &m1).status,
        MilestoneStatus::Paid
    );
    let program = client.get_program(&program_id);
    assert_eq!(program.released_amount, amount_m1);
    assert_eq!(program.status, ProgramStatus::Active); // still active
    assert_eq!(token_client.balance(&recipient), amount_m1);
    assert_eq!(token_client.balance(&contract_id), total_amount - amount_m1);

    // ── 4. Approve milestone 2 → program completes ────────────────────────
    client.approve_milestone(&program_id, &m2, &sponsor);

    assert_eq!(
        client.get_milestone(&program_id, &m2).status,
        MilestoneStatus::Paid
    );
    let program = client.get_program(&program_id);
    assert_eq!(program.released_amount, total_amount);
    assert_eq!(program.status, ProgramStatus::Completed);
    assert_eq!(token_client.balance(&recipient), total_amount);
    assert_eq!(token_client.balance(&contract_id), 0);
}

/// Happy path with a reviewer: reviewer approves each milestone in turn,
/// the reviewer field is preserved after each approval (not consumed).
#[test]
fn test_happy_path_reviewer_approves_multiple_milestones() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);
    let recipient = Address::generate(&env);
    let reviewer = Address::generate(&env);

    let total_amount = 800_i128;
    let amount_m1 = 500_i128;
    let amount_m2 = 300_i128;

    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &Some(reviewer.clone()),
        &None,
    );

    let m1 = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Design"),
        &amount_m1,
        &1_750_000_000,
        &String::from_str(&env, "QmDesign"),
    );
    let m2 = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Delivery"),
        &amount_m2,
        &1_750_086_400,
        &String::from_str(&env, "QmDelivery"),
    );

    // Reviewer approves first milestone
    client.approve_milestone(&program_id, &m1, &reviewer);

    assert_eq!(
        client.get_milestone(&program_id, &m1).status,
        MilestoneStatus::Paid
    );
    // Reviewer option is still present after first approval
    assert_eq!(
        client.get_program(&program_id).reviewer,
        Some(reviewer.clone())
    );
    assert_eq!(token_client.balance(&recipient), amount_m1);

    // Reviewer approves second milestone → program completes
    client.approve_milestone(&program_id, &m2, &reviewer);

    assert_eq!(
        client.get_milestone(&program_id, &m2).status,
        MilestoneStatus::Paid
    );
    let program = client.get_program(&program_id);
    assert_eq!(program.released_amount, total_amount);
    assert_eq!(program.status, ProgramStatus::Completed);
    assert_eq!(program.reviewer, Some(reviewer));
    assert_eq!(token_client.balance(&recipient), total_amount);
    assert_eq!(token_client.balance(&contract_id), 0);
}

/// Happy path cancel: fund → add milestone → approve one → cancel → refund is exact.
#[test]
fn test_happy_path_partial_release_then_cancel() {
    let (env, contract_id, sponsor, token_address, _) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);
    let recipient = Address::generate(&env);

    let total_amount = 1_000_i128;
    let amount_m1 = 250_i128;

    let program_id = client.create_program(
        &sponsor,
        &recipient,
        &token_address,
        &total_amount,
        &None,
        &None,
    );
    let m1 = client.add_milestone(
        &program_id,
        &String::from_str(&env, "Phase 1"),
        &amount_m1,
        &1_750_000_000,
        &String::from_str(&env, "QmM1"),
    );

    client.approve_milestone(&program_id, &m1, &sponsor);

    let sponsor_balance_before_cancel = token_client.balance(&sponsor);

    client.cancel_program(&program_id, &sponsor);

    let program = client.get_program(&program_id);
    assert_eq!(program.status, ProgramStatus::Cancelled);
    assert_eq!(program.released_amount, amount_m1);

    // Refund = total_amount - released_amount = 1000 - 250 = 750
    let expected_refund = total_amount - amount_m1;
    assert_eq!(
        token_client.balance(&sponsor),
        sponsor_balance_before_cancel + expected_refund
    );
    // Contract holds nothing after refund
    assert_eq!(token_client.balance(&contract_id), 0);
    // Recipient received only what was paid before cancellation
    assert_eq!(token_client.balance(&recipient), amount_m1);
}
