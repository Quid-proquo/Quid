# Submission sync: source of truth (#310)

## Source of truth

**The chain is the source of truth for submissions.** A submission exists
once `quid-store::submit_feedback` succeeds on chain; the backend database is
a read model kept in sync by the indexer. The database never creates a
submission the chain does not have, and never overrides on-chain facts.

| Concern | Authority |
|---------|-----------|
| Whether a submission exists, and its IPFS CID | Chain (`submit_feedback`, `update_submission`) |
| Paid | Chain (`payout_participant`) |
| Approved / Rejected + reason | Approval and review reason are off-chain; rejection can also be finalized on-chain with `reject_submission` (which refunds stake) |

## Write paths

```
hunter wallet ──submit_feedback──▶ quid-store ──sub/new event──▶ indexer ──applyChainSubmission──▶ submissions (chain_confirmed = true)
      │
      └──(optional) POST /missions/:id/submissions { ipfsCid, txHash } ──▶ submissions (chain_confirmed = false)
```

1. **Indexer (authoritative):** `SubmissionSyncService.applyChainSubmission`
   upserts the row from on-chain state, sets `chain_confirmed = true`, and
   takes the CID from the chain. The indexer's RPC event polling is tracked
   separately ("Implement quid-store Soroban event indexer"); this is the
   write it calls.
2. **Optimistic API write (optional):** after the hunter's `submit_feedback`
   transaction confirms, the frontend may call
   `POST /missions/:id/submissions` with `{ ipfsCid, txHash }` (JWT required)
   so the submission shows up immediately. The row is `PENDING` with
   `chain_confirmed = false` until the indexer confirms it.

## Invariants

- **One submission per (mission, hunter)**, as on chain (`AlreadySubmitted`):
  enforced by the `submissions_mission_id_hunter_address_key` unique index.
  Concurrent writers (two POSTs, or a POST racing the indexer) resolve
  against the row that won (Prisma `P2002`).
- **Idempotent retries:** repeating the same POST (same CID and tx hash)
  returns the existing row, even if the mission has since been paused. A
  different CID or tx hash for the same (mission, hunter) returns `409`. A tx
  hash can belong to only one submission (`submissions_tx_hash_key`).
- **The hunter is the authenticated wallet** — it is never read from the body
  (extra body fields are rejected).
- **Mission must accept submissions:** `OPEN` or `STARTED`, matching the
  contract's `MissionNotOpen` rule; otherwise `409`.

## Status mapping and transitions

`quid-store` `SubmissionStatus` is `Pending, Approved, Paid, Rejected`
(discriminants 0–3). The Prisma enum has the same names in a different order,
so `fromChainStatus` maps **by name**
(`backend/src/submissions/submission-status.ts`).

| Source | Allowed transitions |
|--------|---------------------|
| Owner review (API) | `PENDING → APPROVED`, `PENDING → REJECTED` |
| Chain (indexer) | `PENDING → PAID`, `APPROVED → PAID`, off-chain `REJECTED → PAID`, or `PENDING → REJECTED` via `reject_submission` |

- `PAID` is terminal. Same-status updates are no-ops.
- `payout_participant` changes the chain status to `Paid`. The owner-only
  `reject_submission` changes it to `Rejected` and is final; a submission
  rejected on-chain cannot subsequently be paid. An off-chain review rejection
  does not update the contract, so the chain may still pay that submission.
- An on-chain `Pending` never undoes an owner's off-chain review.

## API

`POST /missions/:id/submissions` (Bearer JWT)

```json
{ "ipfsCid": "bafy...", "txHash": "<64 hex chars>" }
```

| Status | When |
|--------|------|
| 201 | Row created (`PENDING`, `chainConfirmed: false`) or an identical retry |
| 400 | Invalid CID / tx hash, or unexpected body fields |
| 401 | Missing or invalid JWT |
| 404 | Unknown mission |
| 409 | Mission not `OPEN`/`STARTED`; a different submission already exists for this hunter; tx hash linked to another submission |

## Quid-store event catalog

`quid-store` emits contract events after completing state writes. Topics are
stable and shown in order. Payloads are named fields; addresses decode as
Stellar addresses, symbols as strings, and all monetary amounts are `i128`.
Consumers should tolerate additional payload fields while preserving the
existing topic names.

| Transition | Topics | Payload fields |
|------------|--------|----------------|
| Mission created | `["mission", "create"]` | `mission_id: u64`, `owner: Address`, `title: String`, `description_cid: String`, `reward_token: Address`, `reward_amount: i128`, `max_participants: u32`, `created_at: u64` |
| Submission created | `["sub", "new"]` | `mission_id: u64`, `hunter: Address`, `ipfs_cid: String`, `stake_amount: i128` |
| Submission updated | `["sub", "update"]` | `mission_id: u64`, `hunter: Address`, `ipfs_cid: String` |
| Payout completed | `["payout", "done"]` | `mission_id: u64`, `hunter: Address`, `gross_amount: i128`, `fee_amount: i128`, `net_amount: i128` |
| Submission rejected | `["sub", "reject"]` | `mission_id: u64`, `hunter: Address`, `owner: Address`, `stake_refunded: i128` |
| Stake refunded | `["stake", "refund"]` | `mission_id: u64`, `hunter: Address`, `amount: i128` |
| Mission cancelled | `["mission", "cancel"]` | `mission_id: u64`, `owner: Address`, `refund_amount: i128` |
| Mission expired | `["mission", "expired"]` | `mission_id: u64`, `owner: Address`, `refunded: i128` |
| Mission metadata updated | `["mission", "meta"]` | `mission_id: u64`, `title: String`, `description_cid: String`, `owner: Address` |
| Mission paused | `["mission", "pause"]` | `mission_id: u64`, `owner: Address`, `status: Symbol` |
| Mission status changed | `["mission", "status"]` | `mission_id: u64`, `actor: Address`, `previous_status: Symbol`, `new_status: Symbol` |
| Stake slashed | `["stake", "slash"]` | `mission_id: u64`, `owner: Address`, `hunter: Address`, `token: Address`, `amount: i128` |
| Fee charged | `["fee", "charged"]` | `mission_id: u64`, `token: Address`, `amount: i128` |
| Payout attested | `["payout", "attested"]` | `mission_id: u64`, `attestation_id: u64` |
| Fee charged | `["fee", "charged"]` | `mission_id: u64`, `token: Address`, `amount: i128` |

The fee is charged during mission creation, not deducted from individual
payouts. Therefore, a payout reports its full reward as gross and net, with a
zero payout fee. A stake-refund event is emitted only when a positive stake is
returned.

## Storage retention

Persistent mission, submission, and hunter-stake records have their TTL extended
on each write/update. Stake records are removed after payout or slash.
