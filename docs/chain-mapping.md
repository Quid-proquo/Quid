# Chain ↔ Prisma field mapping (`quid-store`)

Issue #316 — reference for upserting on-chain `quid-store` state into Postgres
without data loss. Source of truth on-chain:
`quid-contract/contracts/quid-store/src/types.rs`.

## Mission

| `quid-store` field (Rust) | Soroban type | Prisma field | Prisma type | Conversion / notes |
|---|---|---|---|---|
| `id` | `u64` | `onChainId` | `BigInt?` | direct; nullable so off-platform/db-first missions stay valid; unique index |
| `owner` | `Address` | `ownerAddress` | `String` (FK → users.address) | direct string (G… account) |
| `title` | `String` | `title` | `String` | direct |
| `description_cid` | `String` | `descriptionCid` | `String` | direct |
| — (not on-chain) | — | `metadataCid` / `metadata` | `String` / `Json` | off-chain enrichment; never overwritten by the indexer |
| `reward_token` | `Address` | `rewardToken` | `String` | contract id (C…) or SAC id |
| `reward_amount` | `i128` | `rewardAmount` | `String` | **stroops as decimal string** — i128 exceeds JS `Number` / `BigInt` column range, keep lossless |
| `max_participants` | `u32` | `maxParticipants` | `Int` | `Number(value)` (safe: < 2³²) |
| `participants_count` | `u32` | `participantsCount` | `Int` | same |
| `status` | `MissionStatus` enum | `status` | `MissionStatus` enum | mapping table below |
| `created_at` | `u64` (ledger timestamp, secs) | `createdAt` | `DateTime` | `new Date(Number(created_at) * 1000)` |
| `min_asset` | `Option<Address>` | `minAssetToken` | `String?` | `None` → `null` |
| `min_asset_amount` | `i128` | `minAssetAmount` | `String` | stroops as decimal string, default `'0'` |
| — (event only) | `MissionCreateEvent.tx` | `escrowTxHash` | `String?` | hash of the `create_mission` transaction |

### Status mapping

| On-chain `MissionStatus` | Prisma `MissionStatus` |
|---|---|
| `Created` | `CREATED` |
| `Open` | `OPEN` |
| `Started` | `STARTED` |
| `Paused` | `PAUSED` |
| `Completed` | `COMPLETED` |
| `Cancelled` | `CANCELLED` |

`CREATED` was added to the Prisma enum in migration
`20260929000000_align_with_quid_store_fields` (the contract emits `Created`
between escrow and publish; older rows keep `OPEN` as the default).

## Submission

| `quid-store` field (Rust) | Soroban type | Prisma field | Prisma type | Conversion / notes |
|---|---|---|---|---|
| key `DataKey::Submission(mission_id, hunter)` | `(u64, Address)` | `missionId` + `hunterAddress` | `String` ×2 | resolve `mission_id` → `missions.on_chain_id` first |
| `ipfs_cid` | `String` | `ipfsCid` | `String` | direct |
| `status` | `SubmissionStatus` enum | `status` | `SubmissionStatus` enum | `Pending`→`PENDING`, `Approved`→`APPROVED`, `Rejected`→`REJECTED`, `Paid`→`PAID` |
| `submitted_at` | `u64` (ledger timestamp) | `createdAt` | `DateTime` | seconds → ms |
| ledger of inclusion | `u32` | `submittedAtLedger` | `BigInt?` | from the `SubNewEvent` transaction envelope |
| `DataKey::HunterStake(...)` value | `i128` | `stakeAmount` | `String` | stroops as decimal string |
| stake token arg | `Address` | `stakeToken` | `String?` | contract/SAC id |
| — (event tx) | `SubNewEvent.tx` | `stakeTxHash` | `String?` | hash of `submit_feedback` |

## Upsert rules (indexer)

1. Resolve `Mission` by `onChainId`; if absent, create with `ownerAddress`
   upserted into `users` first (address is the join key).
2. Never clobber off-chain-only columns (`metadata`, `metadataCid`,
   `aiSummary`, `rejectionReason`) from chain data.
3. Money is always stored as **decimal strings of stroops** — never
   `parseFloat` a `rewardAmount`/`stakeAmount` into a `Float` column.
4. Status transitions flow one way (chain wins for `status`,
   `participantsCount`) except when a DB review is pending
   (`APPROVED` before the on-chain payout lands).
