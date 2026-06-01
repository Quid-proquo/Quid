#![cfg(test)]

use super::*;
use crate::types::{MilestoneStatus, ProgramStatus};
<<<<<<< HEAD
use soroban_sdk::Env;
=======
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};
use soroban_sdk::{testutils::Address as _, testutils::Events, Address, Env, String};

fn setup_test_env() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidMilestoneEscrowContract, ());
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract.address();
    let sponsor = Address::generate(&env);
    let token_admin_client = StellarAssetClient::new(&env, &token_address);
    token_admin_client.mint(&sponsor, &1_000_000);

    (env, contract_id, sponsor, token_address)
}
>>>>>>> f0c6f47 (feat(contracts): implement upsert profile)

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
<<<<<<< HEAD
=======

#[test]
fn test_create_program_funds_and_stores_active_program() {
    let (env, contract_id, sponsor, token_address) = setup_test_env();
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
#[should_panic(expected = "Error(Contract, #2)")]
fn test_create_program_rejects_zero_amount() {
    let (env, contract_id, sponsor, token_address) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);
    let recipient = Address::generate(&env);

    let _ = client.create_program(&sponsor, &recipient, &token_address, &0, &None, &None);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_get_program_not_found() {
    let (env, contract_id, _sponsor, _token_address) = setup_test_env();
    let client = QuidMilestoneEscrowContractClient::new(&env, &contract_id);

    let _ = client.get_program(&999);
}
>>>>>>> f0c6f47 (feat(contracts): implement upsert profile)
