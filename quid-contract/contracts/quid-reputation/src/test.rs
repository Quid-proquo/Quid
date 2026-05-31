#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_bootstrap_admin() {
    let env = Env::default();
    let admin = Address::random(&env);

    let result = QuidReputationContract::bootstrap_admin(env.clone(), admin.clone());

    assert!(result.is_ok());

    let retrieved_admin = QuidReputationContract::get_admin(env).unwrap();
    assert_eq!(retrieved_admin, admin);
}

#[test]
fn test_bootstrap_admin_twice_fails() {
    let env = Env::default();
    let admin1 = Address::random(&env);
    let admin2 = Address::random(&env);

    QuidReputationContract::bootstrap_admin(env.clone(), admin1).unwrap();
    let result = QuidReputationContract::bootstrap_admin(env, admin2);

    assert!(result.is_err());
}

#[test]
fn test_issue_attestation() {
    let env = Env::default();
    let issuer = Address::random(&env);
    let subject = Address::random(&env);

    let attestation_id = QuidReputationContract::issue_attestation(
        env.clone(),
        issuer.clone(),
        subject.clone(),
        String::from_slice(&env, "contributor"),
        String::from_slice(&env, "Active contributor"),
        Some(String::from_slice(&env, "QmExample123")),
        None,
    )
    .unwrap();

    assert_eq!(attestation_id, 1);

    let attestation = QuidReputationContract::get_attestation(env, attestation_id).unwrap();
    assert_eq!(attestation.issuer, issuer);
    assert_eq!(attestation.subject, subject);
    assert_eq!(attestation.revoked, false);
}

#[test]
fn test_issue_attestation_with_expiry() {
    let env = Env::default();
    let issuer = Address::random(&env);
    let subject = Address::random(&env);

    let now = env.ledger().timestamp();
    let expiry = now + 86400; // 1 day from now

    let attestation_id = QuidReputationContract::issue_attestation(
        env.clone(),
        issuer.clone(),
        subject.clone(),
        String::from_slice(&env, "expert"),
        String::from_slice(&env, "Expert reviewer"),
        None,
        Some(expiry),
    )
    .unwrap();

    let attestation = QuidReputationContract::get_attestation(env, attestation_id).unwrap();
    assert_eq!(attestation.expires_at, Some(expiry));
}

#[test]
fn test_revoke_attestation() {
    let env = Env::default();
    let issuer = Address::random(&env);
    let subject = Address::random(&env);

    let attestation_id = QuidReputationContract::issue_attestation(
        env.clone(),
        issuer.clone(),
        subject.clone(),
        String::from_slice(&env, "contributor"),
        String::from_slice(&env, "Active contributor"),
        None,
        None,
    )
    .unwrap();

    let result = QuidReputationContract::revoke_attestation(env.clone(), attestation_id);
    assert!(result.is_ok());

    let attestation = QuidReputationContract::get_attestation(env, attestation_id).unwrap();
    assert_eq!(attestation.revoked, true);
}

#[test]
fn test_empty_label_fails() {
    let env = Env::default();
    let issuer = Address::random(&env);
    let subject = Address::random(&env);

    let result = QuidReputationContract::issue_attestation(
        env,
        issuer,
        subject,
        String::from_slice(&env, "contributor"),
        String::from_slice(&env, ""),
        None,
        None,
    );

    assert!(result.is_err());
}

#[test]
fn test_invalid_expiry_time_fails() {
    let env = Env::default();
    let issuer = Address::random(&env);
    let subject = Address::random(&env);

    let now = env.ledger().timestamp();
    let past_expiry = now - 1000; // In the past

    let result = QuidReputationContract::issue_attestation(
        env,
        issuer,
        subject,
        String::from_slice(&env, "contributor"),
        String::from_slice(&env, "Active contributor"),
        None,
        Some(past_expiry),
    );

    assert!(result.is_err());
}
