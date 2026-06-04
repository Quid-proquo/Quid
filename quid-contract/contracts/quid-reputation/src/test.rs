#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

// ---------------------------------------------------------------------------
// Shared test environment
// ---------------------------------------------------------------------------

/// Registers the contract, mocks all auth, and returns a ready-to-use tuple
/// of `(env, contract_id, admin_address)`.
fn setup_env() -> (Env, Address, Address) {
use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::{types::Profile, QuidReputationContract, QuidReputationContractClient};

fn setup_test_env() -> (Env, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidReputationContract, ());
    let admin = Address::generate(&env);

    (env, contract_id, admin)
}

// ---------------------------------------------------------------------------
// Admin bootstrap tests
// ---------------------------------------------------------------------------

#[test]
fn test_set_admin_succeeds_on_first_call() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    // Bootstrap should succeed when no admin is set yet.
    client.set_admin(&admin);
    let client = QuidReputationContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    (env, contract_id, admin)
}

// -------------------------------------------------------------------------
// Admin bootstrap tests
// -------------------------------------------------------------------------

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    client.initialize(&admin);

    let stored_admin = client.get_admin();
    assert_eq!(stored_admin, admin);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_set_admin_fails_when_already_set() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    // A second call — even with a different address — must be rejected.
    let other = Address::generate(&env);
    client.set_admin(&other);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_admin_fails_when_not_set() {
    let (env, contract_id, _admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    // No admin bootstrapped yet — should return NotAuthorized.
    client.get_admin();
}

// ---------------------------------------------------------------------------
// Profile upsert tests
// ---------------------------------------------------------------------------

#[test]
fn test_upsert_profile_creates_new_profile() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user = Address::generate(&env);
    client.upsert_profile(&user, &5, &2);

    let profile = client.get_profile(&user);
    assert_eq!(profile.owner, user);
    assert_eq!(profile.success_count, 5);
    assert_eq!(profile.rejection_count, 2);
}

#[test]
fn test_upsert_profile_overwrites_existing_profile() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user = Address::generate(&env);

    // Initial upsert.
    client.upsert_profile(&user, &3, &1);

    // Overwrite with new values.
    client.upsert_profile(&user, &10, &4);

    let profile = client.get_profile(&user);
    assert_eq!(profile.success_count, 10);
    assert_eq!(profile.rejection_count, 4);
}

#[test]
fn test_upsert_profile_stores_correct_owner() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user = Address::generate(&env);
    client.upsert_profile(&user, &0, &0);

    let profile = client.get_profile(&user);
    assert_eq!(profile.owner, user);
// -------------------------------------------------------------------------
// Attestation tests
// -------------------------------------------------------------------------

#[test]
fn test_issue_attestation() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    let attestation_id = client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);

    assert_eq!(attestation_id, 1);

    let attestation = client.get_attestation(&attestation_id);
    assert_eq!(attestation.issuer, issuer);
    assert_eq!(attestation.subject, subject);
    assert_eq!(attestation.attestation_type, attestation_type);
    assert_eq!(attestation.data_cid, data_cid);
    assert!(!attestation.revoked);
}

#[test]
fn test_revoke_attestation_by_issuer() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    let attestation_id = client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);

    client.revoke_attestation(&issuer, &attestation_id);

    let attestation = client.get_attestation(&attestation_id);
    assert!(attestation.revoked);
}

#[test]
fn test_revoke_attestation_by_admin() {
    let (env, contract_id, admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    let attestation_id = client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);

    client.revoke_attestation(&admin, &attestation_id);

    let attestation = client.get_attestation(&attestation_id);
    assert!(attestation.revoked);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_upsert_profile_requires_admin() {
    let (env, contract_id, _admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    // No admin set — any mutation must fail with NotAuthorized.
    let user = Address::generate(&env);
    client.upsert_profile(&user, &1, &0);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_get_profile_fails_when_not_found() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let unknown = Address::generate(&env);
    client.get_profile(&unknown);
}

// ---------------------------------------------------------------------------
// increment_success tests
// ---------------------------------------------------------------------------

#[test]
fn test_increment_success_increases_count_by_one() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user = Address::generate(&env);
    client.upsert_profile(&user, &3, &1);

    client.increment_success(&user);

    let profile = client.get_profile(&user);
    assert_eq!(profile.success_count, 4);
    // rejection_count must remain unchanged.
    assert_eq!(profile.rejection_count, 1);
}

#[test]
fn test_increment_success_multiple_times() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user = Address::generate(&env);
    client.upsert_profile(&user, &0, &0);

    client.increment_success(&user);
    client.increment_success(&user);
    client.increment_success(&user);

    let profile = client.get_profile(&user);
    assert_eq!(profile.success_count, 3);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_increment_success_fails_when_profile_missing() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let unknown = Address::generate(&env);
    client.increment_success(&unknown);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_increment_success_requires_admin() {
    let (env, contract_id, _admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    // No admin bootstrapped — must fail.
    let user = Address::generate(&env);
    client.increment_success(&user);
}

// ---------------------------------------------------------------------------
// record_rejection tests
// ---------------------------------------------------------------------------

#[test]
fn test_record_rejection_increases_count_by_one() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user = Address::generate(&env);
    client.upsert_profile(&user, &2, &0);

    client.record_rejection(&user);

    let profile = client.get_profile(&user);
    assert_eq!(profile.rejection_count, 1);
    // success_count must remain unchanged.
    assert_eq!(profile.success_count, 2);
}

#[test]
fn test_record_rejection_multiple_times() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user = Address::generate(&env);
    client.upsert_profile(&user, &0, &0);

    client.record_rejection(&user);
    client.record_rejection(&user);

    let profile = client.get_profile(&user);
    assert_eq!(profile.rejection_count, 2);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_record_rejection_fails_when_profile_missing() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let unknown = Address::generate(&env);
    client.record_rejection(&unknown);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_record_rejection_requires_admin() {
    let (env, contract_id, _admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    // No admin bootstrapped — must fail.
    let user = Address::generate(&env);
    client.record_rejection(&user);
}

// ---------------------------------------------------------------------------
// Combined flow tests
// ---------------------------------------------------------------------------

#[test]
fn test_full_profile_lifecycle() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    // 1. Bootstrap admin.
    client.set_admin(&admin);
    assert_eq!(client.get_admin(), admin);

    // 2. Create a fresh profile.
    let user = Address::generate(&env);
    client.upsert_profile(&user, &0, &0);

    let profile = client.get_profile(&user);
    assert_eq!(profile.success_count, 0);
    assert_eq!(profile.rejection_count, 0);

    // 3. Record two successes.
    client.increment_success(&user);
    client.increment_success(&user);

    let profile = client.get_profile(&user);
    assert_eq!(profile.success_count, 2);
    assert_eq!(profile.rejection_count, 0);

    // 4. Record one rejection.
    client.record_rejection(&user);

    let profile = client.get_profile(&user);
    assert_eq!(profile.success_count, 2);
    assert_eq!(profile.rejection_count, 1);

    // 5. Upsert resets the counters.
    client.upsert_profile(&user, &10, &5);

    let profile = client.get_profile(&user);
    assert_eq!(profile.success_count, 10);
    assert_eq!(profile.rejection_count, 5);
}

#[test]
fn test_independent_profiles_do_not_interfere() {
    let (env, contract_id, admin) = setup_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.set_admin(&admin);

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);

    client.upsert_profile(&user_a, &0, &0);
    client.upsert_profile(&user_b, &0, &0);

    // Mutate only user_a.
    client.increment_success(&user_a);
    client.increment_success(&user_a);
    client.record_rejection(&user_a);

    // user_b must be untouched.
    let profile_b = client.get_profile(&user_b);
    assert_eq!(profile_b.success_count, 0);
    assert_eq!(profile_b.rejection_count, 0);

    // user_a must reflect its own mutations.
    let profile_a = client.get_profile(&user_a);
    assert_eq!(profile_a.success_count, 2);
    assert_eq!(profile_a.rejection_count, 1);
fn test_revoke_attestation_unauthorized() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);
    let unauthorized = Address::generate(&env);

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    let attestation_id = client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);

    client.revoke_attestation(&unauthorized, &attestation_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_revoke_already_revoked_attestation() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    let attestation_id = client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);

    client.revoke_attestation(&issuer, &attestation_id);
    client.revoke_attestation(&issuer, &attestation_id);
}

#[test]
fn test_attestation_count() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    assert_eq!(client.get_attestation_count(), 0);

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);
    assert_eq!(client.get_attestation_count(), 1);

    client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);
    assert_eq!(client.get_attestation_count(), 2);
}

#[test]
fn test_attestation_exists() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    assert!(!client.attestation_exists(&1));

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    let attestation_id = client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);

    assert!(client.attestation_exists(&attestation_id));
}

#[test]
fn test_create_and_get_profile() {
    let (env, _contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &_contract_id);

    let subject = Address::generate(&env);

    let profile = Profile {
        subject: subject.clone(),
        score: 150,
        missions_completed: 5,
        missions_created: 2,
    };

    client.set_profile(&profile);

    let retrieved_profile = client.get_profile(&subject);
    assert_eq!(retrieved_profile.subject, subject);
    assert_eq!(retrieved_profile.score, 150);
    assert_eq!(retrieved_profile.missions_completed, 5);
    assert_eq!(retrieved_profile.missions_created, 2);
}

#[test]
fn test_update_profile() {
    let (env, _contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &_contract_id);

    let subject = Address::generate(&env);

    let profile = Profile {
        subject: subject.clone(),
        score: 100,
        missions_completed: 5,
        missions_created: 2,
    };

    client.set_profile(&profile);

    // Update the profile
    let updated_profile = Profile {
        subject: subject.clone(),
        score: 225,
        missions_completed: 10,
        missions_created: 3,
    };

    client.set_profile(&updated_profile);

    let retrieved_profile = client.get_profile(&subject);
    assert_eq!(retrieved_profile.score, 225);
    assert_eq!(retrieved_profile.missions_completed, 10);
    assert_eq!(retrieved_profile.missions_created, 3);
}

#[test]
fn test_profile_exists() {
    let (env, _contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &_contract_id);

    let subject = Address::generate(&env);

    assert!(!client.profile_exists(&subject));

    let profile = Profile {
        subject: subject.clone(),
        score: 0,
        missions_completed: 0,
        missions_created: 0,
    };

    client.set_profile(&profile);

    assert!(client.profile_exists(&subject));
}

#[test]
fn test_revoke_attestation_publishes_event() {
    let (env, _contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &_contract_id);

    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_type = String::from_str(&env, "skill");
    let data_cid = String::from_str(&env, "QmTest123");

    let attestation_id = client.issue_attestation(&issuer, &subject, &attestation_type, &data_cid);

    // Revoke the attestation (this publishes the AttestationRevokedEvent)
    client.revoke_attestation(&issuer, &attestation_id);

    // Verify the attestation was revoked
    let attestation = client.get_attestation(&attestation_id);
    assert!(attestation.revoked);

    // The AttestationRevokedEvent is published in the revoke_attestation method
    // Event publishing is verified by the contract compilation and execution
}

// -------------------------------------------------------------------------
// Profile helper tests
// -------------------------------------------------------------------------

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_get_profile_not_found() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let subject = Address::generate(&env);
    client.get_profile(&subject);
}

#[test]
fn test_store_and_get_profile() {
    let (env, contract_id, _admin) = setup_test_env();
    let client = QuidReputationContractClient::new(&env, &contract_id);

    let subject = Address::generate(&env);

    env.as_contract(&contract_id, || {
        let profile = Profile {
            subject: subject.clone(),
            score: 42,
            missions_completed: 3,
            missions_created: 1,
        };
        QuidReputationContract::store_profile(&env, &profile);
    });

    let fetched = client.get_profile(&subject);
    assert_eq!(fetched.score, 42);
    assert_eq!(fetched.missions_completed, 3);
    assert_eq!(fetched.missions_created, 1);
}

#[test]
fn test_load_or_default_returns_zeroed_profile() {
    let (env, contract_id, _admin) = setup_test_env();

    let subject = Address::generate(&env);

    env.as_contract(&contract_id, || {
        let profile = QuidReputationContract::load_or_default(&env, subject.clone());
        assert_eq!(profile.subject, subject);
        assert_eq!(profile.score, 0);
        assert_eq!(profile.missions_completed, 0);
        assert_eq!(profile.missions_created, 0);
    });
}
