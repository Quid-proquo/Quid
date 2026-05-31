#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_test_env() -> (Env, Address, QuidReputationContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, QuidReputationContract);
    let client = QuidReputationContractClient::new(&env, &contract_id);
    
    client.bootstrap_admin(&admin);
    
    (env, admin, client)
}

#[test]
fn test_bootstrap_admin() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, QuidReputationContract);
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.bootstrap_admin(&admin);

    let retrieved_admin = client.get_admin();
    assert_eq!(retrieved_admin, admin);
}

#[test]
fn test_bootstrap_admin_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let admin1 = Address::generate(&env);
    let admin2 = Address::generate(&env);
    let contract_id = env.register_contract(None, QuidReputationContract);
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.bootstrap_admin(&admin1);
    let result = client.try_bootstrap_admin(&admin2);

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
        &String::from_str(&env, "Active contributor"),
        &Some(String::from_str(&env, "QmExample123")),
        &None,
    );

    assert_eq!(attestation_id, 1);

    let attestation = client.get_attestation(&attestation_id);
    assert_eq!(attestation.issuer, issuer);
    assert_eq!(attestation.subject, subject);
    assert_eq!(attestation.revoked, false);
}

#[test]
fn test_issue_attestation_with_expiry() {
    let (env, _admin, client) = setup_test_env();
    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let now = env.ledger().timestamp();
    let expiry = now + 86400; // 1 day from now

    let attestation_id = client.issue_attestation(
        &issuer,
        &subject,
        &String::from_str(&env, "expert"),
        &String::from_str(&env, "Expert reviewer"),
        &None,
        &Some(expiry),
    );

    let attestation = client.get_attestation(&attestation_id);
    assert_eq!(attestation.expires_at, Some(expiry));
}

#[test]
fn test_revoke_attestation() {
    let (env, _admin, client) = setup_test_env();
    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let attestation_id = client.issue_attestation(
        &issuer,
        &subject,
        &String::from_str(&env, "contributor"),
        &String::from_str(&env, "Active contributor"),
        &None,
        &None,
    );

    client.revoke_attestation(&attestation_id);

    let attestation = client.get_attestation(&attestation_id);
    assert_eq!(attestation.revoked, true);
}

#[test]
fn test_empty_label_fails() {
    let (env, _admin, client) = setup_test_env();
    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let result = client.try_issue_attestation(
        &issuer,
        &subject,
        &String::from_str(&env, "contributor"),
        &String::from_str(&env, ""),
        &None,
        &None,
    );

    assert!(result.is_err());
}

#[test]
fn test_invalid_expiry_time_fails() {
    let (env, _admin, client) = setup_test_env();
    let issuer = Address::generate(&env);
    let subject = Address::generate(&env);

    let now = env.ledger().timestamp();
    let past_expiry = now; // Expiry <= now should fail

    let result = client.try_issue_attestation(
        &issuer,
        &subject,
        &String::from_str(&env, "contributor"),
        &String::from_str(&env, "Active contributor"),
        &None,
        &Some(past_expiry),
    );

    assert!(result.is_err());
}

// -------------------------------------------------------------------------
// Profile helper tests
// -------------------------------------------------------------------------

#[test]
fn test_get_profile_not_found() {
    let (env, _admin, client) = setup_test_env();

    let subject = Address::generate(&env);
    let result = client.try_get_profile(&subject);
    assert_eq!(result, Err(Ok(QuidError::ProfileNotFound)));
}

#[test]
fn test_store_and_get_profile() {
    let (env, admin, client) = setup_test_env();
    let subject = Address::generate(&env);

    client.increment_success(&subject, &0); // ensure profile exists

    let fetched = client.get_profile(&subject);
    assert_eq!(fetched.score, 0);
    assert_eq!(fetched.successful_missions, 1);
    assert_eq!(fetched.missions_created, 0);
    assert_eq!(fetched.total_earnings, 0);
}

#[test]
fn test_load_or_default_returns_zeroed_profile() {
    let (env, _admin, client) = setup_test_env();

    let subject = Address::generate(&env);

    // If profile doesn't exist, it should return error.
    let result = client.try_get_profile(&subject);
    assert_eq!(result, Err(Ok(QuidError::ProfileNotFound)));
}

// -------------------------------------------------------------------------
// increment_success tests
// -------------------------------------------------------------------------

#[test]
fn test_increment_success() {
    let (env, _admin, client) = setup_test_env();

    let subject = Address::generate(&env);
    
    // First increment
    client.increment_success(&subject, &100);
    
    let fetched = client.get_profile(&subject);
    assert_eq!(fetched.successful_missions, 1);
    assert_eq!(fetched.total_earnings, 100);

    // Second increment
    client.increment_success(&subject, &50);
    
    let fetched2 = client.get_profile(&subject);
    assert_eq!(fetched2.successful_missions, 2);
    assert_eq!(fetched2.total_earnings, 150);
}

#[test]
fn test_increment_success_invalid_reward() {
    let (env, _admin, client) = setup_test_env();

    let subject = Address::generate(&env);
    
    let res = client.try_increment_success(&subject, &-10);
    assert_eq!(res, Err(Ok(QuidError::InvalidRewardAmount)));
}
