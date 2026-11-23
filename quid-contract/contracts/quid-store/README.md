# quid-store

Escrowed bounty marketplace. A creator escrows `reward_amount * max_participants`
up front, hunters submit work against a stake, and the creator pays out
individually. This contract holds the escrow, the submission ledger and the
stake bookkeeping, and it is the only place that moves a hunter's money.

Closes [#289](https://github.com/Quid-proquo/Quid/issues/289),
[#290](https://github.com/Quid-proquo/Quid/issues/290) and
[#292](https://github.com/Quid-proquo/Quid/issues/292).

## Entrypoints

| Function | Auth | Purpose |
|----------|------|---------|
| `create_mission(owner, title, description_cid, reward, max_participants, min_asset, expires_at)` | `owner` | Escrow `reward * max_participants` (+ protocol fee) and open a mission |
| `get_mission(mission_id)` | — | Full mission record, including `expires_at` |
| `submit_feedback(mission_id, hunter, ipfs_cid, stake_token, stake_amount)` | `hunter` | Submit against the mission, locking a stake |
| `update_submission(mission_id, hunter, new_cid)` | `hunter` | Replace the submitted CID while the mission is open |
| `payout_participant(mission_id, hunter)` | mission `owner` | Pay reward + release stake, then attest |
| `cancel_mission(mission_id)` | mission `owner` | Close early and refund the unpaid slots |
| `expire_mission(mission_id)` | — (permissionless) | Reclaim the unpaid slots once the deadline has passed |
| `is_mission_expired(mission_id)` | — | Whether the deadline has already been reached |
| `pause_mission(mission_id)` | mission `owner` | Pause submissions |
| `update_mission_status(mission_id, new_status)` | mission `owner` | Set the status directly |
| `slash_hunter_stake(mission_id, hunter, stake_token)` | mission `owner` | Confiscate a stake for spam |
| `initialize(admin)` | `admin` | One-time: record the admin that configures everything below. Second call fails with `AlreadyInitialized` |
| `get_admin()` | — | The admin (`NotInitialized` before `initialize`) |
| `set_treasury(new_treasury)` | admin | Slash destination |
| `get_treasury()` | — | Current slash destination |
| `set_fee_collector(new_collector)` | admin | Protocol fee vault |
| `get_fee_collector()` | — | Current fee vault |
| `set_staking_pool(new_pool)` | admin | External staking vault |
| `get_staking_pool()` | — | Current staking vault |
| `set_moderation_registry(new_registry)` | admin | Ban/mute registry consulted by `submit_feedback` |
| `get_moderation_registry()` | — | Current registry (`ModerationRegistryNotSet` when unwired) |
| `set_reputation_contract(new_reputation)` | admin | Reputation registry to attest into |
| `get_reputation_contract()` | — | Current registry (`ReputationNotSet` when unwired) |
| `get_mission_count()` / `mission_exists(id)` | — | Read-only helpers |

## Mission expiry

`expires_at` is an optional unix timestamp. `None` means "no deadline" and
behaves exactly like a mission created before this field existed.

- A mission is expired once `ledger.timestamp() >= expires_at` — the deadline
  second itself is already too late.
- `create_mission` rejects a deadline at or before the current timestamp
  (`ExpiryInThePast`), so a mission can never start out already expired.
- Once expired, `submit_feedback` fails with `MissionExpired`. Existing
  submissions survive: the owner can still pay out, slash or cancel them, so a
  deadline never strands work a hunter already delivered.
- `expire_mission` is **permissionless**. The deadline is public state, so
  requiring the owner's signature would only hand a departed founder a way to
  keep escrowed funds locked. It refunds
  `(max_participants - participants_count) * reward_amount` — the slots that
  were never paid out — to the owner, marks the mission `Cancelled`, emits
  `MissionExpiredEvent { mission_id, refunded }` and returns the amount.
- `expire_mission` before the deadline fails with `MissionNotExpired`; calling
  it twice fails with `MissionClosed`, so it cannot be used to drain the escrow
  a second time.

## Payout attestations

`payout_participant` issues a `quid-payout` attestation for the hunter against
the CID they submitted, in `quid-reputation`. The store acts as the *issuer* and
the registry's own admin is left alone, so the store never has to be an admin
and cannot revoke anyone else's records.

The wiring is opt-in. With no registry configured, `attest_payout` returns
immediately and the payout path is byte-for-byte what it was before — the
reputation integration cannot break a mission that predates it. A
`PayoutAttestedEvent { mission_id, attestation_id }` is emitted whenever an
attestation is actually written.

## Security notes

- **Money only ever moves on the owner's signature.** `payout_participant`,
  `cancel_mission`, `pause_mission`, `update_mission_status` and
  `slash_hunter_stake` all call `mission.owner.require_auth()` before touching
  storage or a token. A hunter's own submission stake is authorized by the
  hunter in `submit_feedback`. Nothing in this contract pays on the strength of
  the caller's identity alone.
- **`slash_hunter_stake` is owner-gated, not caller-gated.** The stake leaves
  the store to the configured treasury (or is forwarded to the staking pool),
  never to the hunter and never to the caller, so a mission owner can confiscate
  spam but cannot redirect the pot.
- **Config is gated behind one admin.** `set_treasury`, `set_fee_collector`,
  `set_staking_pool`, `set_moderation_registry` and `set_reputation_contract`
  all call `admin.require_auth()` on the address `initialize` stored, and fail
  with `NotInitialized` before `initialize` has run. Only the admin can move a
  slot, whoever currently holds it. This replaces the old first-caller-wins
  rule, where anyone watching the network could claim a slot on a fresh
  deployment and point fees or slashed stakes at themselves.
- **`initialize` is the one remaining race.** Until it runs, whoever calls it
  first becomes the admin (it needs the new admin's own signature, so it cannot
  be handed to an address the caller does not control, but a front-runner can
  still make *themselves* the admin). Deploy and initialize in the same script
  and confirm with `get_admin`. Mission entrypoints do not depend on the admin.
- **Admin state is instance storage, kept alive.** `initialize` and every
  `set_*` extend the instance TTL (about 60 days), so an idle deployment does
  not lose its admin to archival.
- **`expire_mission` is intentionally the one permissionless money path.** It
  cannot pay anyone but the mission's own owner, only refunds slots that were
  never paid, and is idempotent-by-error rather than idempotent-by-silence.
  Keeping it owner-gated is what would actually lock funds.
- **Cross-contract calls are pre-authorized, not implicitly trusted.**
  `forward_fee` and `attest_payout` use `authorize_as_current_contract` with an
  explicit `SubContractInvocation`, because a contract's implicit auth only
  covers its own direct sub-call. The nested `transfer` / `issue_attestation` is
  therefore authorized for this store and nothing wider.
- **Protocol fees are bounded.** `quote_protocol_fee` rejects a vault that
  returns a negative fee or one larger than the value it was quoted against, so
  a misconfigured collector cannot take more than the mission is worth.
- **Arithmetic is checked.** Escrow totals, refunds and fees all go through
  `checked_mul` / `checked_add` and surface `NegativeReward` rather than
  wrapping.
- **Missions created with a deadline are still paid out normally.** Expiry only
  blocks *new* submissions; it does not claw back rewards already earned.

## Errors

| Code | Variant | When |
|------|---------|------|
| 1 | `MissionNotFound` | No mission with that id |
| 2 | `MissionClosed` | Already completed, cancelled or expired |
| 3 | `MissionFull` | Every slot is taken |
| 4 | `AlreadySubmitted` | This hunter already submitted |
| 5 | `InsufficientFunds` | Stake or escrow too small |
| 6 | `NotAuthorized` | Caller is not the mission owner |
| 7 | `NegativeReward` | Reward math would overflow or go negative |
| 8 | `InvalidState` | Mission is not in a state that allows the call |
| 9 | `AlreadyPaid` | This submission has been paid |
| 10 | `MissionNotOpen` | Mission is not accepting submissions |
| 11 | `SubmissionNotFound` | This hunter has no submission |
| 12 | `NotPending` | Submission is not awaiting payout |
| 13 | `InvalidAmount` | Non-positive stake, or a bad asset-gate amount |
| 14 | `TreasuryNotSet` | Slashing read the treasury before the admin configured it |
| 15 | `StakeNotFound` | No stake locked for that (mission, hunter) |
| 16 | `InsufficientAssetBalance` | Asset gate not met |
| 17 | `FeeCollectorNotSet` | Fee vault read before the admin configured it |
| 18 | `StakingPoolNotSet` | Staking pool read before the admin configured it |
| 19 | `HunterBanned` | Hunter is banned or muted in the configured moderation registry |
| 20 | `ModerationRegistryNotSet` | No moderation registry has been configured |
| 21 | `AlreadyRejected` | Submission was already rejected |
| 22 | `ExpiryInThePast` | `expires_at` is at or before the current timestamp |
| 23 | `MissionExpired` | Submission attempted after the deadline |
| 24 | `MissionNotExpired` | `expire_mission` called before the deadline |
| 25 | `ReputationNotSet` | Reputation registry read before it was configured |
| 26 | `NotInitialized` | A `set_*` entrypoint or `get_admin` ran before `initialize` |
| 27 | `AlreadyInitialized` | `initialize` was called a second time |
| 28 | `Unauthorized` | Reserved. A non-admin caller currently fails in the host's auth check (`Error(Auth, InvalidAction)`), not with this code |

Codes are append-only: `frontend/src/lib/errorMap.ts` keys on these numbers.

## Wiring the optional collaborators

Initialize the store first, right after deploying it. Each collaborator is then
independent and opt-in, and every call below is signed by the **admin**
(`--source admin`), not by the contract being wired in.

```bash
# once, immediately after deploy: becomes the admin for everything below
stellar contract invoke --id <STORE_ID> --source admin --network testnet \
  -- initialize --admin admin

# slash destination
stellar contract invoke --id <STORE_ID> --source admin --network testnet \
  -- set_treasury --new_treasury <TREASURY_ID>

# protocol fee vault (quid-fee-collector)
stellar contract invoke --id <STORE_ID> --source admin --network testnet \
  -- set_fee_collector --new_collector <FEE_COLLECTOR_ID>

# reputation registry (quid-reputation, already initialized)
stellar contract invoke --id <STORE_ID> --source admin --network testnet \
  -- set_reputation_contract --new_reputation <REPUTATION_ID>
```

## Events

| Topics | Payload | Emitted by |
|--------|---------|-----------|
| `mission, create` | `mission_id, owner` | `create_mission` |
| `sub, new` | `mission_id, hunter` | `submit_feedback` |
| `payout, done` | `mission_id, hunter` | `payout_participant` |
| `payout, attested` | `mission_id, attestation_id` | `payout_participant` (registry configured) |
| `mission, cancel` | `mission_id` | `cancel_mission` |
| `mission, expired` | `mission_id, refunded` | `expire_mission` |
| `mission, pause` | `mission_id` | `pause_mission` |
| `fee, charged` | `mission_id, token, amount` | `create_mission` (collector configured) |

## Tests

```bash
cargo test -p quid-store
```

The suite covers the happy path, capacity and double-spend guards, the fee
vault and staking pool integrations, plus negative authorization tests for
every owner-gated entrypoint.
