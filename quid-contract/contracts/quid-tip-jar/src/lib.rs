#![no_std]
use soroban_sdk::{contract, contractevent, contractimpl, token, Address, Env, String};

mod error;
mod types;

use error::TipJarError;
use types::DataKey;

/// Emitted on every successful tip.
///
/// Topics ["tip", "sent"] let the indexer subscribe to all tip activity across
/// deployed instances. The full payload — tipper, hunter, token, amount,
/// mission_id, memo_cid — is recorded in the event data so off-chain consumers
/// have everything they need without additional lookups.
#[contractevent(topics = ["tip", "sent"])]
pub struct TipSentEvent {
    pub tipper: Address,
    pub hunter: Address,
    pub token: Address,
    pub amount: i128,
    pub mission_id: u64,
    pub memo_cid: String,
}

#[contract]
pub struct QuidTipJarContract;

#[contractimpl]
impl QuidTipJarContract {
    /// Send a tip from `tipper` directly to `hunter` for work done on `mission_id`.
    ///
    /// This is a pure pass-through: tokens move from `tipper` to `hunter` in a
    /// single transfer; the contract never holds funds. `memo_cid` is an
    /// optional IPFS CID for a human-readable note — pass an empty string when
    /// not needed.
    ///
    /// # Errors
    /// - `TipJarError::InvalidAmount`  — `amount` is zero or negative
    /// - `TipJarError::InvalidParties` — `tipper` and `hunter` are the same address
    pub fn tip(
        env: Env,
        tipper: Address,
        hunter: Address,
        token: Address,
        amount: i128,
        mission_id: u64,
        memo_cid: String,
    ) -> Result<(), TipJarError> {
        tipper.require_auth();

        if amount <= 0 {
            return Err(TipJarError::InvalidAmount);
        }

        if tipper == hunter {
            return Err(TipJarError::InvalidParties);
        }

        // Pass-through transfer — contract is never the custodian.
        token::Client::new(&env, &token).transfer(&tipper, &hunter, &amount);

        // Update running total for this mission (best-effort, overflow-safe).
        let key = DataKey::MissionTipTotal(mission_id);
        let prev: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&key, &prev.saturating_add(amount));

        TipSentEvent {
            tipper,
            hunter,
            token,
            amount,
            mission_id,
            memo_cid,
        }
        .publish(&env);

        Ok(())
    }

    /// Return the running total of tips sent for `mission_id` across all
    /// tippers and tokens. Useful for quick on-chain reads; the indexer can
    /// provide richer per-token breakdowns from the `TipSentEvent` stream.
    pub fn get_mission_tip_total(env: Env, mission_id: u64) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::MissionTipTotal(mission_id))
            .unwrap_or(0)
    }
}

mod test;
