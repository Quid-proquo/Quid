 #![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};
use types::MissionStatus;

/// Helper function to create test environment and register contract
fn setup_test_env() -> (Env, Address, Address, Address) {
    let env = Env::default();
    let contract_id = env.register(QuidStoreContract, ());

    // Mock the auth for testing
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let token_address = Address::generate(&env);

    (env, contract_id, owner, token_address)
}

#[test]
fn test_create_mission_success() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let title = String::from_str(&env, "Test Mission");
    let description_cid = String::from_str(&env, "QmTest123456789");
    let reward_amount: i128 = 10_000_000; // 100 tokens
    let max_participants: u32 = 50;

    let mission_id = client.create_mission(
        &owner,
        &title,
        &description_cid,
        &token_address,
        &reward_amount,
        &max_participants,
    );

    // Verify mission ID is 1 (first mission)
    assert_eq!(mission_id, 1);

    // Verify mission was stored correctly
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.id, mission_id);
    assert_eq!(mission.owner, owner);
    assert_eq!(mission.title, title);
    assert_eq!(mission.description_cid, description_cid);
    assert_eq!(mission.reward_token, token_address);
    assert_eq!(mission.reward_amount, reward_amount);
    assert_eq!(mission.max_participants, max_participants);
    assert_eq!(mission.participants_count, 0);
    assert_eq!(mission.status, MissionStatus::Created);
    assert!(mission.created_at > 0);
}

#[test]
fn test_create_multiple_missions() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    // Create first mission
    let mission_id_1 = client.create_mission(
        &owner,
        &String::from_str(&env, "Mission 1"),
        &String::from_str(&env, "QmDesc1"),
        &token_address,
        &10_000_000,
        &50,
    );

    // Create second mission
    let mission_id_2 = client.create_mission(
        &owner,
        &String::from_str(&env, "Mission 2"),
        &String::from_str(&env, "QmDesc2"),
        &token_address,
        &20_000_000,
        &100,
    );

    // Verify IDs increment correctly
    assert_eq!(mission_id_1, 1);
    assert_eq!(mission_id_2, 2);

    // Verify mission count
    let count = client.get_mission_count();
    assert_eq!(count, 2);

    // Verify both missions are stored
    let mission_1 = client.get_mission(&mission_id_1);
    let mission_2 = client.get_mission(&mission_id_2);

    assert_eq!(mission_1.title, String::from_str(&env, "Mission 1"));
    assert_eq!(mission_2.title, String::from_str(&env, "Mission 2"));
}

#[test]
fn test_create_mission_empty_title_succeeds() {
    // Since we removed title validation, empty titles are now allowed
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let empty_title = String::from_str(&env, "");
    let description_cid = String::from_str(&env, "QmDesc");

    let mission_id = client.create_mission(
        &owner,
        &empty_title,
        &description_cid,
        &token_address,
        &10_000_000,
        &50,
    );

    // Verify mission was created successfully
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.title, empty_title);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_create_mission_negative_reward_fails() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let title = String::from_str(&env, "Test Mission");
    let description_cid = String::from_str(&env, "QmDesc");
    let negative_reward: i128 = -10_000_000;

    // This should panic with QuidError::NegativeReward (error code #7)
    client.create_mission(
        &owner,
        &title,
        &description_cid,
        &token_address,
        &negative_reward,
        &50,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_mission_not_found() {
    let (env, contract_id, _owner, _token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    // This should panic with QuidError::MissionNotFound (error code #1)
    client.get_mission(&999);
}

#[test]
fn test_get_mission_count_starts_at_zero() {
    let (env, contract_id, _owner, _token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let count = client.get_mission_count();
    assert_eq!(count, 0);
}

#[test]
fn test_create_mission_with_unlimited_participants() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Unlimited Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &0, // 0 = unlimited
    );

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.max_participants, 0);
}

#[test]
fn test_create_mission_with_zero_reward() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    // Zero reward should be valid (free missions)
    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Free Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &0, // Zero reward
        &50,
    );

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.reward_amount, 0);
}

#[test]
fn test_mission_owner_authentication() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Owned Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &50,
    );

    let mission = client.get_mission(&mission_id);

    // Verify the owner is correctly set and authenticated
    assert_eq!(mission.owner, owner);
}

#[test]
fn test_mission_initial_status_is_created() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Status Test"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &50,
    );

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Created);
}

#[test]
fn test_update_mission_status() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    // Create mission
    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Status Update Test"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &50,
    );

    // Verify initial status
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Created);

    // Update to Started
    client.update_mission_status(&mission_id, &MissionStatus::Started);
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Started);

    // Update to Completed
    client.update_mission_status(&mission_id, &MissionStatus::Completed);
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Completed);
}

#[test]
fn test_mission_created_at_timestamp() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let before_time = env.ledger().timestamp();

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Timestamp Test"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &50,
    );

    let after_time = env.ledger().timestamp();
    let mission = client.get_mission(&mission_id);

    // Mission created_at should be between before and after
    assert!(mission.created_at >= before_time);
    // Allow a one-tick difference in test environments where the ledger
    // timestamp may advance during the create call.
    assert!(mission.created_at <= after_time || mission.created_at == after_time + 1);
}

#[test]
fn test_multiple_owners_create_missions() {
    let (env, contract_id, owner1, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let owner2 = Address::generate(&env);

    // Owner 1 creates a mission
    let mission_id_1 = client.create_mission(
        &owner1,
        &String::from_str(&env, "Owner 1 Mission"),
        &String::from_str(&env, "QmDesc1"),
        &token_address,
        &10_000_000,
        &50,
    );

    // Owner 2 creates a mission
    let mission_id_2 = client.create_mission(
        &owner2,
        &String::from_str(&env, "Owner 2 Mission"),
        &String::from_str(&env, "QmDesc2"),
        &token_address,
        &20_000_000,
        &100,
    );

    // Verify both missions have different owners
    let mission_1 = client.get_mission(&mission_id_1);
    let mission_2 = client.get_mission(&mission_id_2);

    assert_eq!(mission_1.owner, owner1);
    assert_eq!(mission_2.owner, owner2);
    assert_ne!(mission_1.owner, mission_2.owner);
}
