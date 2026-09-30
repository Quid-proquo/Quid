#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::testutils::Events as _;
use soroban_sdk::testutils::Ledger as _;
use soroban_sdk::Env;

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEDGER_TIME: u64 = 1_700_000_000;

/// Contract with no oracle configured yet.
fn setup_uninitialized() -> (Env, QuidOracleBridgeContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = LEDGER_TIME);

    let contract_id = env.register(QuidOracleBridgeContract, ());
    let client = QuidOracleBridgeContractClient::new(&env, &contract_id);

    (env, client)
}

/// Contract with `oracle` already set via `initialize`.
fn setup() -> (Env, QuidOracleBridgeContractClient<'static>, Address) {
    let (env, client) = setup_uninitialized();
    let oracle = Address::generate(&env);

    client.initialize(&oracle);

    (env, client, oracle)
}

fn cid(env: &Env, s: &str) -> String {
    String::from_str(env, s)
}

// ── initialize ───────────────────────────────────────────────────────────────

#[test]
fn test_initialize_sets_the_oracle_key() {
    let (env, client) = setup_uninitialized();
    let oracle = Address::generate(&env);

    assert!(client.try_initialize(&oracle).is_ok());

    assert_eq!(client.get_oracle(), Some(oracle));
    drop(env);
}

#[test]
fn test_initialize_twice_is_rejected() {
    let (_env, client, _oracle) = setup();
    let attacker = Address::generate(&_env);

    // The oracle key is immutable — a second initialize must not be able to
    // hand the contract (and therefore every score) to a different address.
    assert_eq!(
        client.try_initialize(&attacker),
        Err(Ok(OracleError::AlreadyInitialized))
    );
    assert_eq!(client.get_oracle(), Some(_oracle));
}

#[test]
fn test_initialize_requires_the_oracles_authorization() {
    let (env, client) = setup_uninitialized();
    let attacker = Address::generate(&env);

    // Drop the auth mocks: without the oracle's own signature the call must
    // fail. This is what stops a third party front-running the deploy.
    env.set_auths(&[]);

    assert!(client.try_initialize(&attacker).is_err());
    assert_eq!(client.get_oracle(), None);
}

// ── publish_score: happy path ─────────────────────────────────────────────────

#[test]
fn test_publish_score_is_queryable_by_mission_and_hunter() {
    let (env, client, oracle) = setup();
    let hunter = Address::generate(&env);

    let record = client.publish_score(&oracle, &7, &hunter, &82, &cid(&env, "bafy-model-v1"));

    assert_eq!(record.mission_id, 7);
    assert_eq!(record.hunter, hunter);
    assert_eq!(record.score, 82);
    assert_eq!(record.model_cid, cid(&env, "bafy-model-v1"));
    assert_eq!(record.revision, 1);
    assert_eq!(record.updated_at, LEDGER_TIME);

    let stored = client.get_score(&7, &hunter);
    assert_eq!(stored, Some(record));
}

#[test]
fn test_publish_score_emits_one_event() {
    let (env, client, oracle) = setup();
    let hunter = Address::generate(&env);

    client.publish_score(&oracle, &1, &hunter, &50, &cid(&env, "bafy-model"));

    let events = env.events().all();
    assert_eq!(events.len(), 1);
    // Declared topics are ["score", "published"]; the publishing contract
    // address is carried separately in the event tuple.
    assert_eq!(events.get(0).unwrap().1.len(), 2);
}

#[test]
fn test_get_score_returns_none_when_the_pair_is_unscored() {
    let (_env, client, _oracle) = setup();
    let hunter = Address::generate(&_env);

    assert_eq!(client.get_score(&999, &hunter), None);
}

#[test]
fn test_scores_are_isolated_per_mission_and_per_hunter() {
    let (env, client, oracle) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.publish_score(&oracle, &1, &alice, &10, &cid(&env, "m1"));
    client.publish_score(&oracle, &1, &bob, &20, &cid(&env, "m2"));
    client.publish_score(&oracle, &2, &alice, &30, &cid(&env, "m3"));

    assert_eq!(client.get_score(&1, &alice).unwrap().score, 10);
    assert_eq!(client.get_score(&1, &bob).unwrap().score, 20);
    assert_eq!(client.get_score(&2, &alice).unwrap().score, 30);
    // The same hunter under a different mission was not touched.
    assert_eq!(client.get_score(&2, &bob), None);
}

// ── publish_score: authorization ──────────────────────────────────────────────

#[test]
fn test_publish_score_rejects_a_non_oracle_caller() {
    let (_env, client, _oracle) = setup();
    let impostor = Address::generate(&_env);
    let hunter = Address::generate(&_env);

    // Auths are mocked, so require_auth() passes: the rejection here is the
    // contract's own oracle comparison, not a missing signature.
    assert_eq!(
        client.try_publish_score(&impostor, &1, &hunter, &90, &cid(&_env, "bafy")),
        Err(Ok(OracleError::NotOracle))
    );
    assert_eq!(client.get_score(&1, &hunter), None);
}

#[test]
fn test_publish_score_requires_a_signature() {
    let (env, client, oracle) = setup();
    let hunter = Address::generate(&env);

    // Drop the auth mocks: publishing without the oracle's signature must fail.
    env.set_auths(&[]);

    assert!(client
        .try_publish_score(&oracle, &1, &hunter, &90, &cid(&env, "bafy"))
        .is_err());
    assert_eq!(client.get_score(&1, &hunter), None);
}

#[test]
fn test_publish_score_requires_initialize() {
    let (env, client) = setup_uninitialized();
    let oracle = Address::generate(&env);
    let hunter = Address::generate(&env);

    assert_eq!(
        client.try_publish_score(&oracle, &1, &hunter, &90, &cid(&env, "bafy")),
        Err(Ok(OracleError::NotInitialized))
    );
}

// ── publish_score: validation ─────────────────────────────────────────────────

#[test]
fn test_publish_score_rejects_a_score_above_the_maximum() {
    let (_env, client, oracle) = setup();
    let hunter = Address::generate(&_env);

    assert_eq!(
        client.try_publish_score(&oracle, &1, &hunter, &101, &cid(&_env, "bafy")),
        Err(Ok(OracleError::InvalidScore))
    );
    assert_eq!(client.get_score(&1, &hunter), None);
}

#[test]
fn test_publish_score_accepts_the_boundary_values() {
    let (_env, client, oracle) = setup();
    let hunter = Address::generate(&_env);

    assert!(client
        .try_publish_score(&oracle, &1, &hunter, &0, &cid(&_env, "bafy"))
        .is_ok());
    assert!(client
        .try_publish_score(&oracle, &2, &hunter, &MAX_SCORE, &cid(&_env, "bafy"))
        .is_ok());
    assert_eq!(client.get_score(&1, &hunter).unwrap().score, 0);
    assert_eq!(client.get_score(&2, &hunter).unwrap().score, 100);
}

#[test]
fn test_publish_score_rejects_an_empty_model_cid() {
    let (_env, client, oracle) = setup();
    let hunter = Address::generate(&_env);

    // The model CID is the audit trail back to the scoring model, so an empty
    // one would make the score unverifiable off-chain.
    assert_eq!(
        client.try_publish_score(&oracle, &1, &hunter, &50, &cid(&_env, "")),
        Err(Ok(OracleError::InvalidModelCid))
    );
    assert_eq!(client.get_score(&1, &hunter), None);
}

// ── publish_score: overwrite policy ───────────────────────────────────────────

#[test]
fn test_oracle_can_republish_and_the_revision_increments() {
    let (env, client, oracle) = setup();
    let hunter = Address::generate(&env);

    let first = client.publish_score(&oracle, &1, &hunter, &40, &cid(&env, "bafy-v1"));
    assert_eq!(first.revision, 1);
    // events().all() reports the events of the most recent invocation only, so
    // capture the first publication before triggering the second.
    let first_events = env.events().all();

    // The model was re-run and produced a better score. Overwriting is allowed
    // so the on-chain value is never stale, but the revision counter makes the
    // replacement auditable.
    let second = client.publish_score(&oracle, &1, &hunter, &75, &cid(&env, "bafy-v2"));
    assert_eq!(second.revision, 2);
    assert_eq!(second.score, 75);
    assert_eq!(second.model_cid, cid(&env, "bafy-v2"));
    let second_events = env.events().all();

    // The latest value wins, and updated_at tracks the new publication.
    let stored = client.get_score(&1, &hunter).unwrap();
    assert_eq!(stored.revision, 2);
    assert_eq!(stored.score, 75);
    assert_eq!(stored.model_cid, cid(&env, "bafy-v2"));

    // Both publications emitted, so the superseded score is still recoverable by
    // an indexer even though storage holds only the latest.
    assert_eq!(first_events.len(), 1);
    assert_eq!(second_events.len(), 1);
}

#[test]
fn test_republishing_updates_the_timestamp() {
    let (env, client, oracle) = setup();
    let hunter = Address::generate(&env);

    client.publish_score(&oracle, &1, &hunter, &40, &cid(&env, "bafy-v1"));
    assert_eq!(
        client.get_score(&1, &hunter).unwrap().updated_at,
        LEDGER_TIME
    );

    env.ledger().with_mut(|l| l.timestamp = LEDGER_TIME + 600);
    client.publish_score(&oracle, &1, &hunter, &40, &cid(&env, "bafy-v1"));

    assert_eq!(
        client.get_score(&1, &hunter).unwrap().updated_at,
        LEDGER_TIME + 600
    );
}

#[test]
fn test_a_non_oracle_cannot_overwrite_an_existing_score() {
    let (_env, client, oracle) = setup();
    let hunter = Address::generate(&_env);
    let impostor = Address::generate(&_env);

    client.publish_score(&oracle, &1, &hunter, &40, &cid(&_env, "bafy-v1"));

    assert_eq!(
        client.try_publish_score(&impostor, &1, &hunter, &100, &cid(&_env, "bafy-evil")),
        Err(Ok(OracleError::NotOracle))
    );

    // The original score is untouched — not even downgraded.
    let stored = client.get_score(&1, &hunter).unwrap();
    assert_eq!(stored.score, 40);
    assert_eq!(stored.revision, 1);
    assert_eq!(stored.model_cid, cid(&_env, "bafy-v1"));
}
