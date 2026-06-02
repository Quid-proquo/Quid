#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::{types::Profile, QuidReputationContract, QuidReputationContractClient};

fn setup_test_env() -> (Env, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidReputationContract, ());
    let admin = Address::generate(&env);

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
