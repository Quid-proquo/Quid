#![cfg(test)]

use super::*;
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

// ── Helpers ───────────────────────────────────────────────────────────────────

fn setup() -> (Env, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidTipJarContract, ());

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract.address();

    (env, contract_id, token_address)
}

fn mint(env: &Env, token: &Address, to: &Address, amount: i128) {
    StellarAssetClient::new(env, token).mint(to, &amount);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[test]
fn test_happy_path_tip() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token);

    let tipper = Address::generate(&env);
    let hunter = Address::generate(&env);
    mint(&env, &token, &tipper, 1_000);

    let tipper_before = token_client.balance(&tipper);
    let hunter_before = token_client.balance(&hunter);

    client.tip(
        &tipper,
        &hunter,
        &token,
        &250,
        &1,
        &String::from_str(&env, ""),
    );

    assert_eq!(token_client.balance(&tipper), tipper_before - 250);
    assert_eq!(token_client.balance(&hunter), hunter_before + 250);
}

#[test]
fn test_tip_total_accumulates() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);

    let tipper = Address::generate(&env);
    let hunter = Address::generate(&env);
    mint(&env, &token, &tipper, 1_000);

    let mission_id = 42_u64;
    assert_eq!(client.get_mission_tip_total(&mission_id), 0);

    client.tip(
        &tipper,
        &hunter,
        &token,
        &100,
        &mission_id,
        &String::from_str(&env, ""),
    );
    assert_eq!(client.get_mission_tip_total(&mission_id), 100);

    client.tip(
        &tipper,
        &hunter,
        &token,
        &75,
        &mission_id,
        &String::from_str(&env, "QmMemo"),
    );
    assert_eq!(client.get_mission_tip_total(&mission_id), 175);
}

#[test]
fn test_tip_total_isolated_per_mission() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);

    let tipper = Address::generate(&env);
    let hunter = Address::generate(&env);
    mint(&env, &token, &tipper, 1_000);

    client.tip(
        &tipper,
        &hunter,
        &token,
        &50,
        &1,
        &String::from_str(&env, ""),
    );
    client.tip(
        &tipper,
        &hunter,
        &token,
        &200,
        &2,
        &String::from_str(&env, ""),
    );

    assert_eq!(client.get_mission_tip_total(&1), 50);
    assert_eq!(client.get_mission_tip_total(&2), 200);
}

#[test]
fn test_tip_with_memo_cid() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);

    let tipper = Address::generate(&env);
    let hunter = Address::generate(&env);
    mint(&env, &token, &tipper, 1_000);

    // Should succeed — memo_cid is passed through without validation.
    client.tip(
        &tipper,
        &hunter,
        &token,
        &10,
        &7,
        &String::from_str(&env, "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"),
    );
}

#[test]
fn test_tip_with_empty_memo_cid() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);

    let tipper = Address::generate(&env);
    let hunter = Address::generate(&env);
    mint(&env, &token, &tipper, 500);

    // Empty memo_cid is explicitly allowed.
    client.tip(
        &tipper,
        &hunter,
        &token,
        &500,
        &99,
        &String::from_str(&env, ""),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_zero_amount_rejected() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);

    let tipper = Address::generate(&env);
    let hunter = Address::generate(&env);
    mint(&env, &token, &tipper, 1_000);

    client.tip(
        &tipper,
        &hunter,
        &token,
        &0,
        &1,
        &String::from_str(&env, ""),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_negative_amount_rejected() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);

    let tipper = Address::generate(&env);
    let hunter = Address::generate(&env);
    mint(&env, &token, &tipper, 1_000);

    client.tip(
        &tipper,
        &hunter,
        &token,
        &-50,
        &1,
        &String::from_str(&env, ""),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_self_tip_rejected() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);

    let tipper = Address::generate(&env);
    mint(&env, &token, &tipper, 1_000);

    // tipper == hunter
    client.tip(
        &tipper,
        &tipper,
        &token,
        &100,
        &1,
        &String::from_str(&env, ""),
    );
}

#[test]
fn test_multiple_tippers_same_mission() {
    let (env, contract_id, token) = setup();
    let client = QuidTipJarContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token);

    let tipper_a = Address::generate(&env);
    let tipper_b = Address::generate(&env);
    let hunter = Address::generate(&env);

    mint(&env, &token, &tipper_a, 500);
    mint(&env, &token, &tipper_b, 500);

    client.tip(
        &tipper_a,
        &hunter,
        &token,
        &300,
        &5,
        &String::from_str(&env, ""),
    );
    client.tip(
        &tipper_b,
        &hunter,
        &token,
        &200,
        &5,
        &String::from_str(&env, ""),
    );

    // Both tippers are debited correctly.
    assert_eq!(token_client.balance(&tipper_a), 200);
    assert_eq!(token_client.balance(&tipper_b), 300);
    // Hunter received both tips.
    assert_eq!(token_client.balance(&hunter), 500);
    // Running total reflects both.
    assert_eq!(client.get_mission_tip_total(&5), 500);
}
