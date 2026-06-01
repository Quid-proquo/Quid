#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Env as _},
    Address, Env,
};

use crate::{QuidReputationContract, QuidReputationContractClient, Profile};

fn setup_contract<'a>(env: &Env) -> QuidReputationContractClient<'a> {
    let admin = Address::generate(env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(env, &contract_id);
    client.initialize(&admin);
    client
}

#[test]
fn test_initialize_sets_admin() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_initialize_fails() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.initialize(&admin);
}

#[test]
fn test_upsert_profile_success() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    client.upsert_profile(
        &subject,
        &10_u32,
        &2_u32,
        &85_u32,
        &90_u32,
        &5000_i128,
    );

    let profile = client.get_profile(&subject).unwrap();
    assert_eq!(profile.subject, subject);
    assert_eq!(profile.successful_missions, 10);
    assert_eq!(profile.rejected_submissions, 2);
    assert_eq!(profile.reviewer_score, 85);
    assert_eq!(profile.founder_score, 90);
    assert_eq!(profile.total_earnings, 5000);
    assert!(profile.updated_at > 0);
}

#[test]
fn test_upsert_profile_updates_existing() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    // First upsert
    client.upsert_profile(
        &subject,
        &5_u32,
        &1_u32,
        &70_u32,
        &80_u32,
        &1000_i128,
    );

    // Second upsert — overwrites
    client.upsert_profile(
        &subject,
        &15_u32,
        &0_u32,
        &95_u32,
        &100_u32,
        &7500_i128,
    );

    let profile = client.get_profile(&subject).unwrap();
    assert_eq!(profile.successful_missions, 15);
    assert_eq!(profile.rejected_submissions, 0);
    assert_eq!(profile.reviewer_score, 95);
    assert_eq!(profile.founder_score, 100);
    assert_eq!(profile.total_earnings, 7500);
}

#[test]
fn test_upsert_profile_rejects_negative_earnings() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    let result = client.try_upsert_profile(
        &subject,
        &5_u32,
        &1_u32,
        &50_u32,
        &50_u32,
        &(-1_i128),
    );

    assert!(result.is_err());
}

#[test]
fn test_upsert_profile_rejects_score_over_100() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    // Reviewer score > 100
    let result = client.try_upsert_profile(
        &subject,
        &5_u32,
        &1_u32,
        &101_u32,
        &50_u32,
        &1000_i128,
    );
    assert!(result.is_err());

    // Founder score > 100
    let result = client.try_upsert_profile(
        &subject,
        &5_u32,
        &1_u32,
        &50_u32,
        &101_u32,
        &1000_i128,
    );
    assert!(result.is_err());
}

#[test]
fn test_upsert_profile_requires_admin_auth() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    // Call without admin auth — should fail
    let result = client.try_upsert_profile(
        &subject,
        &5_u32,
        &1_u32,
        &50_u32,
        &50_u32,
        &1000_i128,
    );

    assert!(result.is_err());
}

#[test]
fn test_get_profile_not_found() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    let result = client.try_get_profile(&subject);
    assert!(result.is_err());
}

#[test]
fn test_upsert_profile_emits_event() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    client.upsert_profile(
        &subject,
        &10_u32,
        &2_u32,
        &85_u32,
        &90_u32,
        &5000_i128,
    );

    // Verify event was published
    let events = env.events().all();
    assert!(!events.is_empty(), "ProfileUpdatedEvent should have been published");
}

#[test]
fn test_upsert_profile_zero_values_allowed() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let subject = Address::generate(&env);
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    client.upsert_profile(
        &subject,
        &0_u32,
        &0_u32,
        &0_u32,
        &0_u32,
        &0_i128,
    );

    let profile = client.get_profile(&subject).unwrap();
    assert_eq!(profile.total_earnings, 0);
    assert_eq!(profile.successful_missions, 0);
}
