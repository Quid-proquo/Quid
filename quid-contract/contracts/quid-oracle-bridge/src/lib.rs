#![no_std]
use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, String};

mod error;
mod types;

use error::OracleError;
use types::{DataKey, QualityScore};

/// Scores are published on a 0-100 scale.
pub const MAX_SCORE: u32 = 100;

/// Emitted on every successful publication.
///
/// Topics ["score", "published"] let the backend AI module (and the indexer)
/// subscribe to the full score stream across deployed instances. `revision`
/// and `overwrites` let consumers tell a first score apart from a re-score, and
/// `model_cid` is the audit trail back to the model that produced the number.
#[contractevent(topics = ["score", "published"])]
pub struct ScorePublishedEvent {
    pub oracle: Address,
    pub mission_id: u64,
    pub hunter: Address,
    pub score: u32,
    pub model_cid: String,
    pub revision: u32,
    pub overwrites: bool,
}

/// Bridges off-chain AI quality / sentiment scores onto Soroban.
///
/// The contract stores only the score, its model CID, and a revision counter —
/// the submission media itself stays on IPFS, so founders can attach scores to
/// existing CIDs without re-uploading anything.
///
/// # Trust model
/// A single oracle key is set once via [`initialize`] and can publish for any
/// mission. Scores are therefore *attributable* (the event names the oracle and
/// the model) but not independently verifiable on-chain: the backend AI module
/// is trusted to report honestly. [`get_score`] and the `score.published` event
/// stream are the read surfaces.
#[contract]
pub struct QuidOracleBridgeContract;

#[contractimpl]
impl QuidOracleBridgeContract {
    /// Set the authorized oracle key. Callable exactly once.
    ///
    /// `oracle.require_auth()` is mandatory: without it, anyone who saw the
    /// deploy transaction could front-run this call and appoint themselves,
    /// which would make every downstream score unauthenticated in practice.
    ///
    /// # Errors
    /// - `OracleError::AlreadyInitialized` — an oracle key is already set
    pub fn initialize(env: Env, oracle: Address) -> Result<(), OracleError> {
        if env.storage().persistent().has(&DataKey::Oracle) {
            return Err(OracleError::AlreadyInitialized);
        }

        oracle.require_auth();
        env.storage().persistent().set(&DataKey::Oracle, &oracle);
        Ok(())
    }

    /// Publish (or re-publish) a quality score for `(mission_id, hunter)`.
    ///
    /// **Overwrite policy:** the oracle may re-score a pair, because models get
    /// re-run and a stale number is worse than a corrected one. Each
    /// republication increments `revision` and emits `overwrites = true`, so
    /// the previous value is recoverable from the event stream rather than
    /// being silently erased. Only the oracle can write, and no other key can
    /// overwrite an oracle's score.
    ///
    /// # Errors
    /// - `OracleError::NotInitialized` — `initialize` was never called
    /// - `OracleError::NotOracle` — `oracle` is not the configured key
    /// - `OracleError::InvalidScore` — `score` exceeds `MAX_SCORE`
    /// - `OracleError::InvalidModelCid` — `model_cid` is empty
    pub fn publish_score(
        env: Env,
        oracle: Address,
        mission_id: u64,
        hunter: Address,
        score: u32,
        model_cid: String,
    ) -> Result<QualityScore, OracleError> {
        oracle.require_auth();

        let authorized: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Oracle)
            .ok_or(OracleError::NotInitialized)?;

        if oracle != authorized {
            return Err(OracleError::NotOracle);
        }

        if score > MAX_SCORE {
            return Err(OracleError::InvalidScore);
        }

        if model_cid.is_empty() {
            return Err(OracleError::InvalidModelCid);
        }

        let score_key = DataKey::Score(mission_id, hunter.clone());
        let revision_key = DataKey::Revision(mission_id, hunter.clone());
        let previous: Option<u32> = env.storage().persistent().get(&revision_key);
        // saturating_add: a pair would need 4 billion republications to wrap,
        // but wrapping revision back to 0 would corrupt the audit trail.
        let revision = previous.unwrap_or(0).saturating_add(1);

        let record = QualityScore {
            mission_id,
            hunter: hunter.clone(),
            score,
            model_cid: model_cid.clone(),
            revision,
            updated_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&score_key, &record);
        env.storage().persistent().set(&revision_key, &revision);

        ScorePublishedEvent {
            oracle,
            mission_id,
            hunter,
            score,
            model_cid,
            revision,
            overwrites: previous.is_some(),
        }
        .publish(&env);

        Ok(record)
    }

    /// Return the current score for `(mission_id, hunter)`, or `None` if the
    /// oracle has not scored that pair.
    pub fn get_score(env: Env, mission_id: u64, hunter: Address) -> Option<QualityScore> {
        env.storage()
            .persistent()
            .get(&DataKey::Score(mission_id, hunter))
    }

    /// Return the configured oracle key, or `None` before `initialize`.
    pub fn get_oracle(env: Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Oracle)
    }
}

mod test;
