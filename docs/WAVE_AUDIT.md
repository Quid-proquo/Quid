# Wave Audit: Codebase Snapshot and Gap Report

Snapshot of `main` at `77c0489` (2026-11-21), taken before opening the next contributor wave. Use it to scope issues. Re-check a file before you rely on a detail here, because `main` moves fast.

---

## 1. Contracts (`quid-contract/`)

Soroban SDK `23.5.3` (workspace dependency). The workspace `Cargo.toml` uses `members = ["contracts/*"]`, so a new crate needs no manifest edit. All 16 crates follow `lib.rs` / `error.rs` / `types.rs` / `test.rs`.

Storage tiers: **I** = instance, **P** = persistent.

| Contract | Public functions | Storage (`DataKey`) |
|----------|------------------|---------------------|
| `quid-store` | `create_mission`, `get_mission`, `get_submission`, `submit_feedback`, `update_submission`, `payout_participant`, `reject_submission`, `cancel_mission`, `expire_mission`, `is_mission_expired`, `pause_mission`, `update_mission_status`, `slash_hunter_stake`, `get_mission_count`, `mission_exists`, `set_/get_treasury`, `set_/get_staking_pool`, `set_/get_fee_collector`, `set_/get_moderation_registry`, `set_/get_reputation_contract` | P: `Mission(u64)`, `Submission(u64, Address)`, `HunterStake(u64, Address)`, `MissionCount`. I: `Treasury`, `StakingPool`, `FeeCollector`, `ModerationRegistry`, `ReputationContract` |
| `quid-reputation` | `initialize`, `get_admin`, `issue_attestation`, `get_attestation`, `revoke_attestation`, `get_attestation_count`, `attestation_exists`, `get_profile`, `set_profile`, `profile_exists` | I: `Admin`, `AttestationCount`. P: `Profile(Address)`, `Attestation(u64)` |
| `quid-milestone-escrow` | `initialize`, `get_/set_admin`, `get_/set_program_status`, `get_/set_milestone_status`, `get_program_count`, `create_program`, `get_program`, `add_milestone`, `get_milestone`, `approve_milestone`, `cancel_program` | I: `Admin`, `ProgramCount`, `ProgramStatus`, `MilestoneStatus`. P: `Program(u64)`, `Milestone(u64, u64)` |
| `quid-dispute` | `create_dispute`, `stake_bond`, `resolve_by_arbiter`, `timeout_release`, `get_dispute`, `get_dispute_count`, `get_open_dispute` | P: `Dispute(u64)`, `OpenDispute(u64, Address)`. I: `DisputeCount` |
| `quid-referral` | `initialize`, `get_/set_admin`, `get_/set_reward_bps`, `compute_reward`, `get_/set_payout_hook`, `register_referral`, `get_referral`, `has_referral`, `get_referred_count`, `record_payout`, `is_payout_recorded`, `fund`, `get_pool_balance`, `claim_reward`, `get_claimable`, `get_claimed` | I: `Admin`, `RewardBps`, `PayoutHook`. P: `Referral`, `ReferredCount`, `Claimable`, `Claimed`, `PayoutRecorded` |
| `quid-badge-nft` | `initialize`, `get_/set_admin`, `collection`, `name`, `symbol`, `base_uri`, `add_/remove_minter`, `is_minter`, `mint_badge`, `get_badge`, `list_by_owner`, `list_ids_by_owner`, `owner_of`, `metadata_cid`, `balance_of`, `total_minted`, `badge_exists`, `has_claimed`, `transfer`, `burn` | I: `Admin`, `Collection`, `BadgeCount`. P: `Minter`, `Badge(u64)`, `Owned(Address)`, `Claimed(Address, BadgeKind, u64)` |
| `quid-fee-collector` | `initialize`, `get_/set_admin`, `get_/set_fee_bps`, `compute_fee`, `collect_fee`, `deposit_fee`, `withdraw_fees`, `get_balance`, `get_balances`, `get_tokens` | I: `Admin`, `FeeBps`, `Tokens`. P: `Balance(Address)` |
| `quid-mission-factory` | `initialize`, `get_admin`, `register_template`, `create_from_template`, `get_template`, `list_templates`, `template_count` | I: `Admin`, `TemplateCount`. P: `Template(u64)` |
| `quid-moderation-registry` | `initialize`, `get_admin`, `set_moderator`, `is_moderator`, `ban`, `unban`, `is_banned`, `get_ban`, `mute`, `unmute`, `is_muted`, `get_mute`, `can_submit` | I: `Admin`. P: `Moderator`, `Banned`, `Muted` |
| `quid-leaderboard` | `initialize`, `get_admin`, `get_/set_recorder`, `get_active_epoch_id`, `get_epoch`, `get_score`, `get_epoch_count`, `start_epoch`, `record_score`, `get_top_n`, `end_epoch` | I: `Admin`, `Recorder`, `ActiveEpochId`, `EpochCount`. P: `Epoch(u64)`, `Score(u64, Address)`, `Hunters(u64)` |
| `quid-staking` | `initialize`, `set_locker`, `deposit`, `withdraw`, `lock_for_mission`, `unlock_for_mission`, `slash_for_mission`, `get_balance`, `get_locked_balance` | I: `Admin`, `Treasury`. P: `Locker`, `Balance`, `Locked`, `MissionLock` |
| `quid-quest-bundle` | `initialize`, `get_/set_admin`, `get_/set_payout_hook`, `create_bundle`, `add_mission`, `record_completion`, `claim_completion_bonus`, `cancel_bundle`, `get_bundle`, `get_bundle_count`, `get_mission_at`, `is_mission_in_bundle`, `get_completed_count`, `is_completed`, `has_claimed`, `is_bundle_complete_for` | I: `Admin`, `PayoutHook`, `BundleCount`. P: `Bundle`, `BundleMission`, `BundleMissionAt`, `Completion`, `CompletedCount`, `Claimed` |
| `quid-access-gate` | `initialize`, `get_admin`, `configure_rule`, `get_rule`, `get_rule_count`, `deactivate_rule`, `check_access`, `check_multiple_access` | I: `Admin`, `RuleCount`. P: `Rule(u64)` |
| `quid-oracle-bridge` | `initialize`, `publish_score`, `get_score`, `get_oracle` | P: `Oracle`, `Score(u64, Address)`, `Revision(u64, Address)` |
| `quid-tip-jar` | `tip`, `get_mission_tip_total` | P: `MissionTipTotal(u64)` |
| `quid-treasury-multisig` | `initialize`, `get_signers`, `get_/set_threshold`, `propose`, `approve`, `execute_transfer`, `get_proposal`, `is_approved` | I: `Signers`, `Threshold`, `ProposalCount`. P: `Proposal(u64)`, `Approval(u64, Address)` |

### Contract gaps

- **First-caller-wins config in `quid-store`** (fixed in #393). `set_treasury`, `set_staking_pool`, `set_fee_collector`, `set_moderation_registry` and `set_reputation_contract` used to accept whoever called first, with no `initialize` or admin, so anyone could front-run a fresh deployment. They are now gated behind an admin set once by `initialize`. The testnet deployment listed in `quid-contract/README.md` predates the fix.
- **No upgrade path.** No contract calls `update_current_contract_wasm`.
- **No `extend_ttl`** in `quid-milestone-escrow`, `quid-oracle-bridge` or `quid-tip-jar`. Their persistent entries will be archived.
- **Admin stored in persistent, not instance:** `quid-oracle-bridge` keeps `Oracle` in persistent storage with no TTL bump.
- **Docs drift.** The `quid-contract/README.md` Contracts table lists 9 of 16 crates. The README calls the rest "unlisted experiments", but the frontend already calls `quid-tip-jar`, and FE-003 targets `quid-leaderboard`. "Known gaps" still lists mission expiry, which `expire_mission` now covers.
- **Snapshots.** `quid-contract/.gitignore` ignores `**/*/test_snapshots`, but snapshots for `quid-store`, `quid-reputation` and `quid-milestone-escrow` are tracked anyway.

---

## 2. Backend (`backend/`)

NestJS 11, Prisma 7 (`@prisma/adapter-pg`), Postgres 15. `main.ts` sets the global prefix `api`, a global `ValidationPipe` (whitelist, forbid unknown), an env-driven CORS allowlist, and a global `ThrottlerGuard` (100 req / 60 s).

### Modules

| Module | Contents |
|--------|----------|
| `PrismaModule` | `PrismaService` |
| `AuthModule` | SEP-10 challenge/verify, `JwtStrategy`, `JwtAuthGuard` |
| `UsersModule` | user profile and role |
| `MissionsModule` | `MissionsController`, `SubmissionsController`, `MissionsService`, `SubmissionSyncService` (no separate `SubmissionsModule`) |
| `HunterModule` | hunter submissions list |
| `UploadModule` | Pinata IPFS client; returns 503 when unconfigured |
| `NotificationsModule` (`@Global`) | `NotificationsService`, `InAppChannel`, `WebhookChannel` (outbound to `NOTIFICATION_WEBHOOK_URL`) |
| `IndexerModule` | `IndexerService` cron that polls Soroban RPC events for `CONTRACT_ID` |
| `VerificationModule` | empty, added on this branch (see §5) |
| `WebhooksModule` | empty, added on this branch (see §5) |

### Prisma models

`User`, `Mission`, `MissionDraft`, `Submission` (unique on `[missionId, hunterAddress]`), `IndexerState`, `Notification`, `NotificationDelivery`.
Enums: `UserRole {EARNER, CREATOR}`, `MissionStatus {CREATED, OPEN, STARTED, PAUSED, COMPLETED, CANCELLED}`, `SubmissionStatus {PENDING, APPROVED, REJECTED, PAID}`, `NotificationType {SUBMISSION_PAID, SUBMISSION_REJECTED}`, `NotificationChannelName {IN_APP, WEBHOOK}`, `NotificationDeliveryStatus {PENDING, SENT, FAILED}`.

### Routes (all under `/api`; 🔒 = `JwtAuthGuard`)

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/auth/challenge` |
| POST | `/auth/verify` |
| GET 🔒 | `/users/me` |
| PATCH 🔒 | `/users/me/role` |
| GET | `/missions` |
| GET 🔒 | `/missions/me` |
| GET 🔒 | `/missions/drafts/me` |
| POST 🔒 | `/missions/drafts` |
| POST 🔒 | `/missions/drafts/:draftId/publish` |
| GET | `/missions/on-chain/:onChainId` |
| GET | `/missions/:id` |
| POST 🔒 | `/missions/:id/attach` |
| GET 🔒 | `/missions/:id/submissions` |
| POST 🔒 | `/missions/:id/submissions` |
| POST 🔒 | `/missions/:missionId/submissions/:id/approve` |
| POST 🔒 | `/missions/:missionId/submissions/:id/reject` |
| GET 🔒 | `/hunter/my-submissions` |
| POST 🔒 | `/upload` |
| POST 🔒 | `/upload/json` |

### Backend gaps

- **`test/app.e2e-spec.ts` is broken.** It calls `GET /` and expects `Hello World!`, a route that no longer exists. CI never runs `test:e2e`, which is why nobody noticed. (BE-051)
- **Notifications have no read API.** Rows are written but there's no controller and no `readAt` field. (BE-052)
- **No OpenAPI docs.** (BE-053)
- **`npm run lint` runs `eslint --fix`**, so CI's lint step rewrites files instead of failing on them.
- **Port mismatch.** `main.ts` defaults to `3000` when `PORT` is unset, which collides with the frontend. `.env.example` sets `3001`.

---

## 3. Frontend (`frontend/`)

Next.js 16.2, React 19.2, Tailwind 4, `@stellar/stellar-sdk` 14, `@stellar/freighter-api` 6.

### Pages

| Route | Data source |
|-------|-------------|
| `/` | Static landing |
| `/(auth)/connect-wallet`, `/(auth)/account-type` | Freighter + `PATCH /users/me/role` |
| `/creator` | API (`/missions/me`) |
| `/creator/quests`, `/creator/quests/new`, `/creator/quests/[questId]`, `/creator/quests/[questId]/edit` | API + `quid-store` via `lib/soroban/quid-store.ts` |
| `/creator/milestones` | `quid-milestone-escrow` via `lib/milestone-escrow-client.ts` |
| `/creator/wallet` | Horizon balances via `useWallet` |
| `/hunter` | **Hardcoded.** Renders `HunterQuestTabs`, which holds `forYouQuests` / `allQuests` / `myQuests` arrays |
| `/hunter/mission-board` | API (`GET /missions`) |
| `/hunter/my-submissions` | API (`GET /hunter/my-submissions`) |
| `/hunter/wallet` | Static placeholder (SEP-24 slot added on this branch) |
| `/missions` | Redirects to `/hunter/mission-board` |
| `/leaderboard` | **Hardcoded** `DEFAULT_LEADERBOARD` and `'Season 1'` (FE-003) |
| `/passport/[address]` | **Hardcoded** `getMockProfile()`, the same profile for every address (FE-004) |
| `/design-preview`, `/privacy`, `/terms` | Static |

### Wallet integration

Freighter only. `lib/freighter-wallet.ts` handles connect, address, network, signing, and `NetworkMismatchError`. `context/WalletProvider.tsx` exposes `useWallet()` (connection, Horizon balances, network check). UI lives in `components/wallet/WalletConnectButton.tsx` and `NetworkMismatchBanner.tsx`. Login uses SEP-10 through `lib/api/client.ts`.

### Contract clients

`lib/soroban/quid-store.ts` (the convention going forward), plus older clients at the root of `lib/`: `soroban-client.ts`, `milestone-escrow-client.ts`, `tip-jar-client.ts`. There are no clients yet for `quid-reputation`, `quid-leaderboard` or `quid-dispute`.

### Frontend gaps

- Mock or static data in `/hunter` (`HunterQuestTabs`), `/leaderboard`, `/passport/[address]`. The landing page ships sample mission cards. They read as examples but are hardcoded.
- **Invented hero metrics** ("120k+ Verified Participants", "1.2M+ Rewards Distributed"). Replaced on this branch with factual claims.
- **FAQ claimed features that don't exist** (demographic targeting, GDPR compliance, encryption at rest). Rewritten on this branch.
- **No test runner.** There's no `test` script. (FE-001)
- **Dead or duplicate code.** `features/participant/Onboarding.tsx` isn't imported anywhere. `useFormStatus` exists in both `src/app/hooks/` and `src/hooks/`, and the two copies have diverged.
- **Terminology.** Routes and identifiers still say "quest" (`/creator/quests`, `QuestWizard`, `useQuestData`). UI strings are standardized on this branch (see §5). Renaming routes is a separate breaking change.
- **Stored labels.** The wizard saves option labels as values (`rewardMethod: "All participants"`, eligibility options). They were left unchanged so existing drafts still match. Fixing this properly means storing an enum key and mapping it to a label.
- **Mixed line endings.** Some files use `\r\r\n` (e.g. `app/page.tsx`). There's no `.gitattributes`.

---

## 4. Tooling, CI and env

| Problem | Where | Issue |
|---------|-------|-------|
| CI builds contracts with `wasm32-unknown-unknown`, but the docs and `stellar contract build` use `wasm32v1-none` | `.github/workflows/ci.yml` | CI-002 |
| CI doesn't run `npm run type-check` for the frontend | `ci.yml` | CI-001 |
| CI doesn't run `npm run test:e2e` for the backend (and the spec is broken) | `ci.yml` | BE-051 |
| CI sets `NEXT_PUBLIC_API_URL=http://localhost:3001` without the required `/api` suffix | `ci.yml` (frontend job) | new |
| CI doesn't set `NEXT_PUBLIC_QUID_TIP_JAR_ID` or `NEXT_PUBLIC_SOROBAN_RPC_URL` | `ci.yml` (frontend job) | new |
| `NEXT_PUBLIC_STELLAR_NETWORK` is read in `lib/freighter-wallet.ts` but missing from `.env.example` | `frontend/.env.example` | new |
| `NEXT_PUBLIC_QUID_LEADERBOARD_ID` doesn't exist yet | `frontend/.env.example` | FE-003 |
| `NEXT_PUBLIC_QUID_TIP_JAR_ID` in `.env.example` is the all-A placeholder (not deployed) | `frontend/.env.example` | new |
| `CONTRIBUTING.md` referenced `.env.local.example` (doesn't exist) and `frontend/Design.md` (it's `design/Design.md`) | `CONTRIBUTING.md` | fixed here |
| `.DS_Store` committed at the repo root, and no root `.gitignore` | root | fixed here (REPO-001) |

Backend `.env.example` covers every variable the backend code reads.

### Local check results on this branch

| Command | Result |
|---------|--------|
| `frontend`: `eslint`, `tsc --noEmit`, `next build` | See PR description |
| `backend`: `eslint` (no `--fix`), `jest`, `nest build` | See PR description |
| `quid-contract`: `cargo fmt/clippy/test` | Not run locally (no Rust toolchain on the audit machine). CI will run them. |

---

## 5. Changes on this branch

Nothing existing was removed. No routes, identifiers or Prisma schema changed.

- **Positioning.** Landing hero, metadata and section copy now position Quid as "The On-Chain Verified QA & UX Testing Platform for Stellar & Soroban Builders". The brutalist dark and light theme tokens are unchanged.
- **Terminology.** UI strings now say Mission, Creator and Hunter, across the landing page, dashboards, the wizard, error messages (`lib/errorMap.ts`) and legal pages.
- **Placeholders.** `lib/upcoming-features.ts` plus `components/ui/coming-soon.tsx` provide Coming Soon slots for **On-Chain Proof-of-Test** (creator sidebar, `SubmissionCard`), **Disputes** (both sidebars) and **SEP-24 Cashout** (hunter sidebar, `/hunter/wallet`), plus a landing `RoadmapSection`. To ship a feature, set its `status` to `"live"` and replace the placeholder at each listed `insertionPoints` path.
- **Extension points.** `quid-store` now has `fees.rs`, `stream.rs`, `guardian.rs` and `upgrade.rs` (doc-only modules). The backend has `verification/` and `webhooks/` modules, already registered. The frontend has `lib/soroban/README.md`.
- **Guardrails.** Root `.gitignore`, `.DS_Store` untracked, `.github/ISSUE_TEMPLATE/wave-task.md`, and a rewritten `CONTRIBUTING.md`.
