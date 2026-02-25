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

fn mint_tokens_for_hunter(env: &Env, token_address: &Address, hunter: &Address, amount: i128) {
    let token_admin_client = StellarAssetClient::new(env, token_address);
    token_admin_client.mint(hunter, &amount);
}

#[test]
fn test_happy_path_create_submit_payout() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let hunter = Address::generate(&env);
    let reward_amount = 100;
    let stake = 10;

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Happy Path"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    let cid = String::from_str(&env, "QmSubmission");
    client.submit_feedback(&mission_id, &hunter, &cid, &token_address, &stake);

    let balance_before = token_client.balance(&hunter);
    client.payout_participant(&mission_id, &hunter);

    let balance_after = token_client.balance(&hunter);
    assert_eq!(balance_after, balance_before + reward_amount);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.participants_count, 1);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_prevent_double_submission() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Double Sub Test"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    let cid = String::from_str(&env, "QmFirst");
    client.submit_feedback(&mission_id, &hunter, &cid, &token_address, &10);
    client.submit_feedback(&mission_id, &hunter, &cid, &token_address, &10);
}

#[test]
fn test_cancel_mission_refund() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let reward_amount: i128 = 100;
    let slots: u32 = 10;
    let total_deposit = reward_amount * (slots as i128);

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Refund Test"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &slots,
        &min_asset,
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

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Full Test"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &1,
        &min_asset,
    );

    let hunter1 = Address::generate(&env);
    let hunter2 = Address::generate(&env);
    mint_tokens_for_hunter(&env, &token_address, &hunter1, 1000);
    mint_tokens_for_hunter(&env, &token_address, &hunter2, 1000);
    let cid = String::from_str(&env, "QmVal");

    client.submit_feedback(&mission_id, &hunter1, &cid, &token_address, &10);
    client.submit_feedback(&mission_id, &hunter2, &cid, &token_address, &10);

    client.payout_participant(&mission_id, &hunter1);
    client.payout_participant(&mission_id, &hunter2);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_cannot_payout_twice() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Double Pay"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "Qm"),
        &token_address,
        &10,
    );
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
    let (env, contract_id, _owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);
    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);
    client.submit_feedback(
        &999,
        &hunter,
        &String::from_str(&env, "Qm"),
        &token_address,
        &10,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_create_mission_negative_reward() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 0,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let _ = client.create_mission(
        &owner,
        &String::from_str(&env, "Bad Reward"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_submit_feedback_when_paused() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Pause Test"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );
    client.pause_mission(&mission_id);
    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "Qm"),
        &token_address,
        &10,
    );
}

#[test]
fn test_cancel_mission_partial_payouts_refund() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let reward_amount: i128 = 100;
    let slots: u32 = 3;

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Partial Refund"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &slots,
        &min_asset,
    );

    let hunter = Address::generate(&env);
    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);
    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "QmSub"),
        &token_address,
        &10,
    );
    client.payout_participant(&mission_id, &hunter);

    let owner_balance_before_cancel = token_client.balance(&owner);
    client.cancel_mission(&mission_id);
    let owner_balance_after_cancel = token_client.balance(&owner);

    let expected_refund = (slots - 1) as i128 * reward_amount;
    assert_eq!(
        owner_balance_after_cancel,
        owner_balance_before_cancel + expected_refund
    );

    let contract_balance = token_client.balance(&contract_id);
    assert_eq!(contract_balance, 10);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Cancelled);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_payout_without_submission() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "No Sub"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );
    client.payout_participant(&mission_id, &hunter);
}

#[test]
fn test_stake_deducted_on_submission() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    let hunter = Address::generate(&env);
    let stake_amount = 50;
    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Stake Test"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    let hunter_balance_before = token_client.balance(&hunter);
    let contract_balance_before = token_client.balance(&contract_id);

    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "QmSubmission"),
        &token_address,
        &stake_amount,
    );

    let hunter_balance_after = token_client.balance(&hunter);
    let contract_balance_after = token_client.balance(&contract_id);

    assert_eq!(hunter_balance_after, hunter_balance_before - stake_amount);
    assert_eq!(
        contract_balance_after,
        contract_balance_before + stake_amount
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_stake_invalid_amount_zero() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Invalid Stake"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "QmSubmission"),
        &token_address,
        &0,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_stake_invalid_amount_negative() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Negative Stake"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "QmSubmission"),
        &token_address,
        &-10,
    );
}

#[test]
fn test_update_submission_success() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Update Test"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    let original_cid = String::from_str(&env, "QmOriginal");
    client.submit_feedback(&mission_id, &hunter, &original_cid, &token_address, &10);

    let new_cid = String::from_str(&env, "QmUpdated");
    client.update_submission(&mission_id, &hunter, &new_cid);

    // Verify submission was updated (by trying to payout - should work)
    client.payout_participant(&mission_id, &hunter);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_update_submission_after_payout() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Update After Pay"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "QmFirst"),
        &token_address,
        &10,
    );
    client.payout_participant(&mission_id, &hunter);

    // Should fail: already paid
    client.update_submission(&mission_id, &hunter, &String::from_str(&env, "QmNew"));
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_update_submission_not_found() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "No Sub Update"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    // Try to update without submitting first
    client.update_submission(&mission_id, &hunter, &String::from_str(&env, "QmNew"));
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_update_submission_mission_not_open() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let hunter = Address::generate(&env);

    mint_tokens_for_hunter(&env, &token_address, &hunter, 1000);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Paused Update"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    client.submit_feedback(
        &mission_id,
        &hunter,
        &String::from_str(&env, "QmFirst"),
        &token_address,
        &10,
    );
    client.pause_mission(&mission_id);

    // Should fail: mission is paused
    client.update_submission(&mission_id, &hunter, &String::from_str(&env, "QmNew"));
}

#[test]
fn test_create_mission_with_asset_gating() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let gating_token = Address::generate(&env);
    let min_amount: i128 = 1000;

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: Some(gating_token.clone()),
        min_asset_amount: min_amount,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Gated Mission"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.min_asset, Some(gating_token));
    assert_eq!(mission.min_asset_amount, min_amount);
}

#[test]
fn test_create_mission_without_asset_gating() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "No Gate"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.min_asset, None);
    assert_eq!(mission.min_asset_amount, 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_create_mission_with_zero_asset_amount() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let gating_token = Address::generate(&env);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: Some(gating_token),
        min_asset_amount: 0,
    };

    let _ = client.create_mission(
        &owner,
        &String::from_str(&env, "Invalid Gate"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_create_mission_with_negative_asset_amount() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let gating_token = Address::generate(&env);

    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount: 100,
    };

    let min_asset = MinAsset {
        min_asset_token: Some(gating_token),
        min_asset_amount: -100,
    };

    let _ = client.create_mission(
        &owner,
        &String::from_str(&env, "Negative Gate"),
        &String::from_str(&env, "QmDesc"),
        &reward,
        &5,
        &min_asset,
    );
}

#[test]
fn test_full_lifecycle_integration() {
    // Setup environment
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_address);

    // Create hunter and mint tokens
    let hunter = Address::generate(&env);
    let hunter_initial_balance: i128 = 1000;
    mint_tokens_for_hunter(&env, &token_address, &hunter, hunter_initial_balance);

    // Mission parameters
    let reward_amount: i128 = 100;
    let stake_amount: i128 = 10;
    let max_participants: u32 = 5;

    // Record initial balances
    let owner_balance_initial = token_client.balance(&owner);
    let hunter_balance_initial = token_client.balance(&hunter);
    let contract_balance_initial = token_client.balance(&contract_id);

    // Step 1: Create mission
    let reward = Reward {
        reward_token: token_address.clone(),
        reward_amount,
    };

    let min_asset = MinAsset {
        min_asset_token: None,
        min_asset_amount: 0,
    };

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Full Lifecycle Test"),
        &String::from_str(&env, "QmTestDescription"),
        &reward,
        &max_participants,
        &min_asset,
    );

    // Verify mission was created
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.id, mission_id);
    assert_eq!(mission.owner, owner);
    assert_eq!(mission.reward_amount, reward_amount);
    assert_eq!(mission.max_participants, max_participants);
    assert_eq!(mission.participants_count, 0);
    assert_eq!(mission.status, MissionStatus::Open);

    // Verify balances after mission creation
    let total_reward_pool = reward_amount * (max_participants as i128);
    let owner_balance_after_create = token_client.balance(&owner);
    let contract_balance_after_create = token_client.balance(&contract_id);
    
    assert_eq!(
        owner_balance_after_create,
        owner_balance_initial - total_reward_pool
    );
    assert_eq!(
        contract_balance_after_create,
        contract_balance_initial + total_reward_pool
    );

    // Step 2: Submit work
    let submission_cid = String::from_str(&env, "QmSubmissionHash");
    client.submit_feedback(
        &mission_id,
        &hunter,
        &submission_cid,
        &token_address,
        &stake_amount,
    );

    // Verify balances after submission (stake deducted)
    let hunter_balance_after_submit = token_client.balance(&hunter);
    let contract_balance_after_submit = token_client.balance(&contract_id);
    
    assert_eq!(
        hunter_balance_after_submit,
        hunter_balance_initial - stake_amount
    );
    assert_eq!(
        contract_balance_after_submit,
        contract_balance_after_create + stake_amount
    );

    // Step 3: Payout participant
    client.payout_participant(&mission_id, &hunter);

    // Verify final balances
    let hunter_balance_final = token_client.balance(&hunter);
    let contract_balance_final = token_client.balance(&contract_id);
    let mission_final = client.get_mission(&mission_id);

    // Hunter should have: initial - stake + reward
    assert_eq!(
        hunter_balance_final,
        hunter_balance_initial - stake_amount + reward_amount
    );

    // Contract should have: initial pool + stake - reward
    assert_eq!(
        contract_balance_final,
        contract_balance_after_create + stake_amount - reward_amount
    );

    // Mission should be updated
    assert_eq!(mission_final.participants_count, 1);
    assert_eq!(mission_final.status, MissionStatus::Open);

    // Verify the submission status was updated
    // (We can't directly access submission, but payout wouldn't work if status wasn't Pending)
}
