#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{
    error::ReputationError, types::Profile, QuidReputationContract, QuidReputationContractClient,
};

fn setup() -> (Env, Address, QuidReputationContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(QuidReputationContract, ());
    let client = QuidReputationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, admin, client)
}

// -------------------------------------------------------------------------
// Admin bootstrap tests
// -------------------------------------------------------------------------

#[test]
fn test_set_and_get_admin() {
    let (_env, admin, client) = setup();
    client.set_admin(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
fn test_get_admin_not_set_returns_error() {
    let (_env, _admin, client) = setup();
    let result = client.try_get_admin();
    assert_eq!(result, Err(Ok(ReputationError::AdminNotSet)));
}

// -------------------------------------------------------------------------
// get_profile tests
// -------------------------------------------------------------------------

#[test]
fn test_get_profile_not_found() {
    let (env, admin, client) = setup();
    client.set_admin(&admin);
    let subject = Address::generate(&env);
    let result = client.try_get_profile(&subject);
    assert_eq!(result, Err(Ok(ReputationError::ProfileNotFound)));
}

#[test]
fn test_store_and_get_profile() {
    let (env, admin, client) = setup();
    client.set_admin(&admin);

    let subject = Address::generate(&env);

    // Use the internal helpers via a direct contract call simulation.
    // We store a profile manually and then read it back via the public getter.
    env.as_contract(&client.address, || {
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
    let (env, admin, client) = setup();
    client.set_admin(&admin);

    let subject = Address::generate(&env);

    env.as_contract(&client.address, || {
        let profile = QuidReputationContract::load_or_default(&env, subject.clone());
        assert_eq!(profile.subject, subject);
        assert_eq!(profile.score, 0);
        assert_eq!(profile.missions_completed, 0);
        assert_eq!(profile.missions_created, 0);
    });
}
