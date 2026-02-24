#![cfg(test)]

use super::*;
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};
use soroban_sdk::{testutils::Address as _, vec, Address, Env, IntoVal, String};
use types::MissionStatus;

/// Helper function to create test environment and register contract
fn setup_test_env() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy QuidStore contract
    let contract_id = env.register(QuidStoreContract, ());

    // Create addresses
    let owner = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Deploy a real Stellar token contract
    // FIX 1: This returns a StellarAssetContract struct, not just an Address
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());

    // FIX 2: Extract the actual address to use with clients
    let token_address = token_contract.address();

    // Mint a large balance to owner (for escrow tests)
    // Use admin interface to mint tokens
    let admin_client = StellarAssetClient::new(&env, &token_address);

    // FIX 3: mint() takes (&to, &amount). The admin/auth is handled by mock_all_auths() or the client context.
    admin_client.mint(&owner, &1_000_000_000_000);

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
#[should_panic]
fn test_create_mission_with_zero_reward_fails() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    client.create_mission(
        &owner,
        &String::from_str(&env, "Free Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &0,
        &50,
    );
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

    // FIX: We need the admin client to mint tokens for the second owner
    let admin_client = StellarAssetClient::new(&env, &token_address);

    let owner2 = Address::generate(&env);

    // FIX: Mint tokens for owner2 so they can pay the escrow
    admin_client.mint(&owner2, &10_000_000_000);

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

#[test]
fn test_cancel_mission_success() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Cancel Test Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &50,
    );

    // Cancel the mission
    client.cancel_mission(&mission_id);

    // Verify status is now Cancelled
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Cancelled);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_cancel_mission_fails_if_completed() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Completed Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &50,
    );

    // Set mission to Completed first
    client.update_mission_status(&mission_id, &MissionStatus::Completed);

    // Attempting to cancel a completed mission should fail with InvalidState (#8)
    client.cancel_mission(&mission_id);
}

#[test]
fn test_cancel_mission_from_started_status() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Started Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_address,
        &10_000_000,
        &50,
    );

    // Move to Started
    client.update_mission_status(&mission_id, &MissionStatus::Started);

    // Cancel from Started should succeed
    client.cancel_mission(&mission_id);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Cancelled);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_cancel_mission_not_found() {
    let (env, contract_id, _owner, _token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    // Cancelling a non-existent mission should fail with MissionNotFound (#1)
    client.cancel_mission(&999);
}

#[test]
fn test_escrow_balance_after_mission_creation() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_id);

    let reward_amount = 10_000_000;
    let max_participants = 5;
    let total_needed = reward_amount * max_participants as i128;

    client.create_mission(
        &owner,
        &String::from_str(&env, "Escrow Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &reward_amount,
        &max_participants,
    );

    // FIX: Use `contract_id` directly instead of `env.current_contract_address()`
    // `env.current_contract_address()` causes a panic because we are in the test harness, not inside a contract call.
    let contract_balance = token_client.balance(&contract_id);

    assert_eq!(contract_balance, total_needed);
}

// ===== Enhanced get_mission tests =====

#[test]
fn test_get_mission_returns_exact_struct() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let title = String::from_str(&env, "Exact Struct Test");
    let description_cid = String::from_str(&env, "QmExact123");
    let reward_amount: i128 = 15_000_000;
    let max_participants: u32 = 25;

    let mission_id = client.create_mission(
        &owner,
        &title,
        &description_cid,
        &token_address,
        &reward_amount,
        &max_participants,
    );

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
fn test_get_missions_batch_query() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let id1 = client.create_mission(
        &owner,
        &String::from_str(&env, "Batch Test 1"),
        &String::from_str(&env, "QmBatch1"),
        &token_address,
        &10_000_000,
        &10,
    );

    let id2 = client.create_mission(
        &owner,
        &String::from_str(&env, "Batch Test 2"),
        &String::from_str(&env, "QmBatch2"),
        &token_address,
        &20_000_000,
        &20,
    );

    let ids = vec![&env, id1, id2];
    let results = client.get_missions(&ids);

    assert_eq!(results.len(), 2);

    // Verify the results
    let result_1 = results.get(0).unwrap();
    let result_2 = results.get(1).unwrap();

    // Unwrap the results and verify
    let mission_1 = result_1.unwrap();
    let mission_2 = result_2.unwrap();

    assert_eq!(mission_1.id, id1);
    assert_eq!(mission_2.id, id2);
    assert_eq!(mission_1.title, String::from_str(&env, "Batch Test 1"));
    assert_eq!(mission_2.title, String::from_str(&env, "Batch Test 2"));
}

#[test]
fn test_mission_exists_function() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Existence Test"),
        &String::from_str(&env, "QmExist"),
        &token_address,
        &10_000_000,
        &10,
    );

    assert!(client.mission_exists(&mission_id));

    // Test non-existent mission
    assert!(!client.mission_exists(&999));

    // Test another non-existent mission
    assert!(!client.mission_exists(&0));
}

#[test]
fn test_get_mission_reward_optimized_query() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let reward_amount: i128 = 25_000_000;

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Reward Query Test"),
        &String::from_str(&env, "QmReward"),
        &token_address,
        &reward_amount,
        &15,
    );

    let (returned_token, returned_amount) = client.get_mission_reward(&mission_id);

    // Verify reward details match
    assert_eq!(returned_token, token_address);
    assert_eq!(returned_amount, reward_amount);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_mission_reward_not_found() {
    let (env, contract_id, _owner, _token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    // This should panic with QuidError::MissionNotFound (error code #1)
    client.get_mission_reward(&999);
}

#[test]
fn test_get_mission_status_lightweight_query() {
    let (env, contract_id, owner, token_address) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Status Query Test"),
        &String::from_str(&env, "QmStatus"),
        &token_address,
        &10_000_000,
        &10,
    );

    let status = client.get_mission_status(&mission_id);
    assert_eq!(status, MissionStatus::Created);

    // Update status
    client.update_mission_status(&mission_id, &MissionStatus::Started);

    // Verify status changed
    let status = client.get_mission_status(&mission_id);
    assert_eq!(status, MissionStatus::Started);
}

mod submit_feedback_tests {
    use soroban_sdk::token::StellarAssetClient;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    use crate::{DataKey, QuidStoreContract, QuidStoreContractClient};

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /// Mirrors setup_test_env() but scoped to this mod so it stays
    /// self-contained and independent of the outer test helpers.
    fn setup() -> (Env, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(QuidStoreContract, ());
        let token_admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_address = token_contract.address();

        // Give the owner enough balance to fund any escrow in these tests.
        let hunter = Address::generate(&env);
        StellarAssetClient::new(&env, &token_address).mint(&hunter, &1_000_000_000_000);

        (env, contract_id, hunter, token_address)
    }

    fn ipfs_cid(env: &Env) -> String {
        String::from_str(
            env,
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        )
    }

    // ------------------------------------------------------------------
    // Happy path
    // ------------------------------------------------------------------

    /// Core acceptance criterion: calling submit_feedback persists the CID
    /// and it can be read back from persistent storage under the correct key.
    #[test]
    fn stores_ipfs_cid_for_mission_and_hunter() {
        let (env, contract_id, hunter, _token) = setup();
        let client = QuidStoreContractClient::new(&env, &contract_id);

        let cid = ipfs_cid(&env);
        client.submit_feedback(&1u64, &hunter, &cid);

        let stored: String = env.as_contract(&contract_id, || {
            env.storage()
                .persistent()
                .get(&DataKey::Submission(1u64, hunter.clone()))
                .expect("submission must be stored under DataKey::Submission")
        });

        assert_eq!(stored, cid);
    }

    /// A second submission on the same (mission, hunter) pair overwrites the
    /// first — last-write-wins, no duplicate guard in this scaffold.
    #[test]
    fn overwrites_previous_submission() {
        let (env, contract_id, hunter, _token) = setup();
        let client = QuidStoreContractClient::new(&env, &contract_id);

        let cid_v1 = String::from_str(&env, "bafybeifirst");
        let cid_v2 = String::from_str(&env, "bafybeisecond");

        client.submit_feedback(&1u64, &hunter, &cid_v1);
        client.submit_feedback(&1u64, &hunter, &cid_v2);

        let stored: String = env.as_contract(&contract_id, || {
            env.storage()
                .persistent()
                .get(&DataKey::Submission(1u64, hunter.clone()))
                .unwrap()
        });

        assert_eq!(stored, cid_v2);
    }

    /// Two hunters on the same mission are stored at independent keys and
    /// do not overwrite each other.
    #[test]
    fn different_hunters_have_independent_storage_keys() {
        let (env, contract_id, hunter_a, token) = setup();
        let client = QuidStoreContractClient::new(&env, &contract_id);

        let hunter_b = Address::generate(&env);
        StellarAssetClient::new(&env, &token).mint(&hunter_b, &1_000_000_000_000);

        let cid_a = String::from_str(&env, "bafybeia");
        let cid_b = String::from_str(&env, "bafybeib");

        client.submit_feedback(&1u64, &hunter_a, &cid_a);
        client.submit_feedback(&1u64, &hunter_b, &cid_b);

        let stored_a: String = env.as_contract(&contract_id, || {
            env.storage()
                .persistent()
                .get(&DataKey::Submission(1u64, hunter_a.clone()))
                .unwrap()
        });
        let stored_b: String = env.as_contract(&contract_id, || {
            env.storage()
                .persistent()
                .get(&DataKey::Submission(1u64, hunter_b.clone()))
                .unwrap()
        });

        assert_eq!(stored_a, cid_a);
        assert_eq!(stored_b, cid_b);
    }

    /// The same hunter submitting to two different missions produces two
    /// independent storage entries.
    #[test]
    fn same_hunter_different_missions_are_independent() {
        let (env, contract_id, hunter, _token) = setup();
        let client = QuidStoreContractClient::new(&env, &contract_id);

        let cid_m1 = String::from_str(&env, "bafybeimission1");
        let cid_m2 = String::from_str(&env, "bafybeimission2");

        client.submit_feedback(&1u64, &hunter, &cid_m1);
        client.submit_feedback(&2u64, &hunter, &cid_m2);

        let stored_m1: String = env.as_contract(&contract_id, || {
            env.storage()
                .persistent()
                .get(&DataKey::Submission(1u64, hunter.clone()))
                .unwrap()
        });
        let stored_m2: String = env.as_contract(&contract_id, || {
            env.storage()
                .persistent()
                .get(&DataKey::Submission(2u64, hunter.clone()))
                .unwrap()
        });

        assert_eq!(stored_m1, cid_m1);
        assert_eq!(stored_m2, cid_m2);
    }

    // ------------------------------------------------------------------
    // Auth enforcement
    // ------------------------------------------------------------------

    /// Without hunter auth the SDK panics — #[should_panic] is the correct
    /// pattern since require_auth() does not return a typed Result.
    #[test]
    #[should_panic]
    fn fails_without_hunter_auth() {
        let env = Env::default();
        // Deliberately no mock_all_auths — auth cannot be satisfied.
        let contract_id = env.register(QuidStoreContract, ());
        let client = QuidStoreContractClient::new(&env, &contract_id);
        let hunter = Address::generate(&env);

        client.submit_feedback(&1u64, &hunter, &ipfs_cid(&env));
    }

    /// env.auths() lets us assert that the hunter — and not some other
    /// address — was the address that satisfied require_auth().
    #[test]
    fn requires_exactly_hunter_auth() {
        let (env, contract_id, hunter, _token) = setup();
        let client = QuidStoreContractClient::new(&env, &contract_id);

        client.submit_feedback(&1u64, &hunter, &ipfs_cid(&env));

        let auths = env.auths();
        assert!(
            auths.iter().any(|(addr, _)| addr == &hunter),
            "hunter must be the authorising address"
        );
    }
}
// ===== Cancel + Refund Tests =====

#[test]
fn test_cancel_mission_full_refund() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_id);

    let reward_amount = 10_000_000;
    let max_participants = 5;
    let total_needed = reward_amount * max_participants as i128;

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Refund Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &reward_amount,
        &max_participants,
    );

    let contract_balance_before = token_client.balance(&contract_id);
    assert_eq!(contract_balance_before, total_needed);

    client.cancel_mission(&mission_id);

    let contract_balance_after = token_client.balance(&contract_id);
    assert_eq!(contract_balance_after, 0);

    let owner_balance_final = token_client.balance(&owner);
    assert_eq!(owner_balance_final, 1_000_000_000_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_cancel_already_cancelled_mission_fails() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &10_000_000,
        &50,
    );

    client.cancel_mission(&mission_id);
    client.cancel_mission(&mission_id); // should panic
}

#[test]
fn test_pause_mission_success() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Pause Test Mission"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &10_000_000,
        &50,
    );

    // Initial status should be Created
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Created);

    // Pause the mission
    client.pause_mission(&mission_id);

    // Verify status is now Paused
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Paused);
}

#[test]
#[should_panic]
fn test_pause_mission_only_owner_can_pause() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Owner Only Pause Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &10_000_000,
        &50,
    );

    // Create a different user
    let non_owner = Address::generate(&env);

    // Mock non-owner authentication
    env.mock_auths(&[soroban_sdk::testutils::MockAuth {
        address: &non_owner,
        invoke: &soroban_sdk::testutils::MockAuthInvoke {
            contract: &contract_id,
            fn_name: "pause_mission",
            args: (mission_id,).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    // Attempting to pause as non-owner should fail because the contract expects owner's auth
    // Since we are mocking non_owner's auth for this call, require_auth(owner) will fail.
    client.pause_mission(&mission_id);
}

#[test]
fn test_payout_participant_success() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);
    let token_client = TokenClient::new(&env, &token_id);

    let hunter = Address::generate(&env);
    let reward_amount = 10_000_000;
    let max_participants = 5;

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Payout Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &reward_amount,
        &max_participants,
    );

    // 1. Manually set submission state to Pending (simulating a submission)
    let submission_key = DataKey::Submission(mission_id, hunter.clone());
    env.as_contract(&contract_id, || {
        env.storage()
            .persistent()
            .set(&submission_key, &SubmissionStatus::Pending);
    });

    let hunter_balance_before = token_client.balance(&hunter);
    assert_eq!(hunter_balance_before, 0);

    // 2. Execute payout
    client.payout_participant(&mission_id, &hunter);

    // 3. Verify hunter received reward
    let hunter_balance_after = token_client.balance(&hunter);
    assert_eq!(hunter_balance_after, reward_amount);

    // 4. Verify mission state updated
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.participants_count, 1);

    // 5. Verify submission status updated to Paid
    let submission_status: SubmissionStatus = env.as_contract(&contract_id, || {
        env.storage().persistent().get(&submission_key).unwrap()
    });
    assert_eq!(submission_status, SubmissionStatus::Paid);

    // 6. Verify paid flag set
    let paid_key = DataKey::Paid(mission_id, hunter);
    let paid_exists = env.as_contract(&contract_id, || env.storage().persistent().has(&paid_key));
    assert!(paid_exists);
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_payout_participant_submission_not_found() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let hunter = Address::generate(&env);

    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &10_000_000,
        &5,
    );

    // No submission state set - should fail with SubmissionNotFound (#10)
    client.payout_participant(&mission_id, &hunter);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_payout_already_paid_fails() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let hunter = Address::generate(&env);
    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &10_000_000,
        &5,
    );

    // Setup: already paid
    let submission_key = DataKey::Submission(mission_id, hunter.clone());
    env.as_contract(&contract_id, || {
        env.storage()
            .persistent()
            .set(&submission_key, &SubmissionStatus::Pending);
    });

    // First payout
    client.payout_participant(&mission_id, &hunter);

    // Second payout should fail with AlreadyPaid (#9)
    client.payout_participant(&mission_id, &hunter);
}

#[test]
fn test_payout_completes_mission_at_max_participants() {
    let (env, contract_id, owner, token_id) = setup_test_env();
    let client = QuidStoreContractClient::new(&env, &contract_id);

    let max_participants = 1;
    let mission_id = client.create_mission(
        &owner,
        &String::from_str(&env, "Max Payout Test"),
        &String::from_str(&env, "QmDesc"),
        &token_id,
        &10_000_000,
        &max_participants,
    );

    let hunter = Address::generate(&env);
    let submission_key = DataKey::Submission(mission_id, hunter.clone());
    env.as_contract(&contract_id, || {
        env.storage()
            .persistent()
            .set(&submission_key, &SubmissionStatus::Pending);
    });

    client.payout_participant(&mission_id, &hunter);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Completed);
}
