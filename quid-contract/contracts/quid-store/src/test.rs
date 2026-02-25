#![cfg(test)]

use super::*;
use crate::types::MissionStatus;
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_test_env() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidStoreContract, ());
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract.address();
    let owner = Address::generate(&env);
    let token_admin_client = StellarAssetClient::new(&env, &token_address);
    token_admin_client.mint(&owner, &1_000_000_000_000);

    (env, contract_id, owner, token_address)
}

#[test]
fn test_happy_path_create_submit_payout() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let hunter = Address::generate(&env);
    let reward = 100;

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Happy Path"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &reward,
        &5,
    );

    let cid = String::from_str(&env, "QmSubmission");
    client.submit_feedback(&mission_id, &hunter, &cid);

    let balance_before = token_client.balance(&hunter);
    client.payout_participant(&mission_id, &hunter);

    let balance_after = token_client.balance(&hunter);
    assert_eq!(balance_after, balance_before + reward);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.participants_count, 1);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_prevent_double_submission() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Double Sub Test"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &100,
        &5,
    );

    let cid = String::from_str(&env, "QmFirst");
    client.submit_feedback(&mission_id, &hunter, &cid);
    client.submit_feedback(&mission_id, &hunter, &cid);
}

#[test]
fn test_cancel_mission_refund() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let reward: i128 = 100;
    let slots: u32 = 10;
    let total_deposit = reward * (slots as i128);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Refund Test"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &reward,
        &slots,
    );

    let contract_balance = token_client.balance(&contract_id);
    assert_eq!(contract_balance, total_deposit);

    client.cancel_mission(&mission_id);

    let contract_balance_after = token_client.balance(&contract_id);
    assert_eq!(contract_balance_after, 0);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Cancelled);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_mission_capacity_limit() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Full Test"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &100,
        &1,
    );

    let hunter1 = Address::generate(&env);
    let hunter2 = Address::generate(&env);
    let cid = String::from_str(&env, "QmVal");

    client.submit_feedback(&mission_id, &hunter1, &cid);
    client.submit_feedback(&mission_id, &hunter2, &cid);

    client.payout_participant(&mission_id, &hunter1);
    client.payout_participant(&mission_id, &hunter2);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_cannot_payout_twice() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Double Pay"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &100,
        &5,
    );

    client.submit_feedback(&mission_id, &hunter, &String::from_str(&env, "Qm"));
    client.payout_participant(&mission_id, &hunter);
    client.payout_participant(&mission_id, &hunter);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_mission_not_found() {
    let (env, contract_id, _owner, _token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let _ = client.get_mission(&999);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_submit_feedback_mission_not_found() {
    let (env, contract_id, _owner, _token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);
    client.submit_feedback(&999, &hunter, &String::from_str(&env, "Qm"));
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_create_mission_negative_reward() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let _ = client.create_mission(
        &owner,
        &String::from_str(&env, "Bad Reward"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &0,
        &5,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_submit_feedback_when_paused() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Pause Test"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &100,
        &5,
    );
    client.pause_mission(&mission_id);
    client.submit_feedback(&mission_id, &hunter, &String::from_str(&env, "Qm"));
}

#[test]
fn test_cancel_mission_partial_payouts_refund() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let reward: i128 = 100;
    let slots: u32 = 3;

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Partial Refund"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &reward,
        &slots,
    );

    let hunter = Address::generate(&env);
    client.submit_feedback(&mission_id, &hunter, &String::from_str(&env, "QmSub"));
    client.payout_participant(&mission_id, &hunter);

    let owner_balance_before_cancel = token_client.balance(&owner);
    client.cancel_mission(&mission_id);
    let owner_balance_after_cancel = token_client.balance(&owner);

    let expected_refund = (slots - 1) as i128 * reward;
    assert_eq!(
        owner_balance_after_cancel,
        owner_balance_before_cancel + expected_refund
    );

    let contract_balance = token_client.balance(&contract_id);
    assert_eq!(contract_balance, 0);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Cancelled);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_payout_without_submission() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "No Sub"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &100,
        &5,
    );
    client.payout_participant(&mission_id, &hunter);
}
