#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_test_env() -> (Env, Address, QuidReputationContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    (env, admin, client)
}

#[test]
fn test_initialize_sets_admin() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    let retrieved_admin = client.get_admin();
    assert_eq!(retrieved_admin, admin);
}

#[test]
fn test_initialize_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    let result = client.try_initialize(&admin);

    assert!(result.is_err());
}

#[test]
fn test_issue_attestation() {
    let (env, _admin, client) = setup_test_env();
    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_id = client.issue_attestation(
        &issuer,
        &subject,
        &String::from_str(&env, "contributor"),
        &String::from_str(&env, "QmExample123"),
    );

    assert_eq!(attestation_id, 1);

    let attestation = client.get_attestation(&attestation_id);
    assert_eq!(attestation.issuer, issuer);
    assert_eq!(attestation.subject, subject);
    assert!(!attestation.revoked);
}

#[test]
fn test_revoke_attestation() {
    let (env, admin, client) = setup_test_env();
    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_id = client.issue_attestation(
        &issuer,
        &subject,
        &String::from_str(&env, "contributor"),
        &String::from_str(&env, "QmExample123"),
    );

    client.revoke_attestation(&admin, &attestation_id);

    let attestation = client.get_attestation(&attestation_id);
    assert!(attestation.revoked);
}

#[test]
fn test_get_profile_not_found() {
    let (env, _admin, client) = setup_test_env();
    let subject = Address::generate(&env);
    let result = client.try_get_profile(&subject);
    assert!(result.is_err());
}

#[test]
fn test_upsert_profile_success() {
    let (env, _admin, client) = setup_test_env();
    let subject = Address::generate(&env);

    client.upsert_profile(&subject, &85, &10, &2, &5000);

    let profile = client.get_profile(&subject);
    assert_eq!(profile.score, 85);
    assert_eq!(profile.missions_completed, 10);
    assert_eq!(profile.missions_created, 2);
}

#[test]
fn test_upsert_profile_updates_existing() {
    let (env, _admin, client) = setup_test_env();
    let subject = Address::generate(&env);

    client.upsert_profile(&subject, &50, &5, &1, &1000);
    client.upsert_profile(&subject, &95, &15, &3, &7500);

    let profile = client.get_profile(&subject);
    assert_eq!(profile.score, 95);
    assert_eq!(profile.missions_completed, 15);
}

#[test]
fn test_upsert_profile_rejects_negative_earnings() {
    let (env, _admin, client) = setup_test_env();
    let subject = Address::generate(&env);

    let result = client.try_upsert_profile(&subject, &50, &5, &1, &(-1));
    assert!(result.is_err());
}

#[test]
fn test_upsert_profile_emits_event() {
    let (env, _admin, client) = setup_test_env();
    let subject = Address::generate(&env);

    client.upsert_profile(&subject, &85, &10, &2, &5000);

    let events = env.events().all();
    assert!(!events.is_empty());
}
