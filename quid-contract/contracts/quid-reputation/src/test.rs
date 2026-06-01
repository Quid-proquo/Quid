#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_test_env() -> (Env, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QuidReputationContract, ());
    let admin = Address::generate(&env);

    let client = QuidReputationContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    (env, contract_id, admin)
}

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

    // Issuer revokes their own attestation
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

    // Admin revokes the attestation
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

    // Unauthorized user tries to revoke
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

    // Revoke once
    client.revoke_attestation(&issuer, &attestation_id);

    // Try to revoke again
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
