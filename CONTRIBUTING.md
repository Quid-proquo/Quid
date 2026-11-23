# Contributing to Quid

Thanks for helping build Quid, the on-chain verified QA and UX testing platform for Stellar and Soroban builders.

## Why Quid

Builders launch dApps into quiet Discords, and real users rarely spend 20 minutes testing edge cases. Quid turns testing into an escrowed transaction. **Creators** lock rewards in a **Mission**, **Hunters** test the dApp and submit a report, and the payout happens on-chain when the creator approves it.

## Terminology

Use these terms in UI copy, docs, issues and PR titles:

| Use | Not |
|-----|-----|
| **Mission** | quest, campaign, survey |
| **Creator** | founder, business, research team |
| **Hunter** | participant, tester, earner, contributor (when you mean a product user) |
| **Report** / **submission** | response, answer |

Some code identifiers still use the old names (`QuestWizard`, `/creator/quests`, `useQuestData`). Don't rename identifiers or routes as part of feature work. That's a separate refactor and would conflict with every open PR.

## Repo map

| Path | What you'll work on |
|------|---------------------|
| `frontend/` | Next.js UI, Freighter, creator and hunter flows |
| `backend/` | NestJS API: SEP-10 auth, mission index, IPFS upload, indexer, notifications |
| `quid-contract/` | Soroban contracts (16 crates; `quid-store` is the core escrow) |
| `docs/` | Flow docs and the [wave audit](./docs/WAVE_AUDIT.md) |
| `design/` | Design specs ([Design.md](./design/Design.md)) |

Read the README in each package before starting. For a snapshot of what exists and what's missing, see [docs/WAVE_AUDIT.md](./docs/WAVE_AUDIT.md).

### Where new code goes

These folders exist so parallel PRs don't edit the same files:

| Area | Put it in |
|------|-----------|
| New Soroban contract | `quid-contract/contracts/<quid-name>/` (no workspace edit needed) |
| New logic inside `quid-store` | `fees.rs`, `stream.rs`, `guardian.rs` or `upgrade.rs` (already declared) |
| Proof-of-Test verification (backend) | `backend/src/verification/` |
| Webhook subscriptions / inbound webhooks | `backend/src/webhooks/` |
| Alerts and delivery channels | `backend/src/notifications/` |
| Chain event ingestion | `backend/src/indexer/` |
| Hunter-only UI | `frontend/src/components/hunter/` |
| Creator-only UI | `frontend/src/components/creator/` |
| Wallet / Freighter UI | `frontend/src/components/wallet/` |
| Contract clients | `frontend/src/lib/soroban/<contract>.ts` (see its README) |
| Unbuilt feature placeholders | `frontend/src/lib/upcoming-features.ts` |

`verification/` and `webhooks/` are already registered in `app.module.ts`. Add providers inside the module, not to `app.module.ts`.

## Prerequisites

- Node.js 20 (CI uses 20; 18+ works locally)
- Docker (for local Postgres)
- Rust stable with the `wasm32v1-none` target: `rustup target add wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools)
- Freighter set to Testnet

## Local setup

```bash
git clone https://github.com/Quid-proquo/Quid.git
cd Quid
```

### Contracts

```bash
cd quid-contract
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
stellar contract build          # outputs target/wasm32v1-none/release/*.wasm
```

### Backend

```bash
cd backend
docker compose up -d            # Postgres on :5432
cp .env.example .env            # set JWT_SECRET and STELLAR_SERVER_SECRET
npm ci
npm run prisma:migrate          # applies migrations, generates the client
npm run lint                    # note: runs eslint --fix and rewrites files
npm test
npm run build
npm run start:dev               # http://localhost:3001/api
```

### Seed data and demo mode (Issue #430)

Run `npm run db:seed` after the migrations to populate a local database with realistic organizations, missions in every status, submissions, proofs, disputes, cashouts, notifications and leaderboard rows. The seed uses a fixed faker seed and idempotent upserts, so running it twice is safe.

Set `DEMO_MODE=true` to serve the seeded data as a read-only demo: every non-GET route returns `403` with `{ "code": "DEMO_READ_ONLY" }`, and requests without an `Authorization` header are treated as the seeded `DEMO_ADDRESS` hunter. Set `DEMO_ADDRESS` if you want a different seeded account. Never enable demo mode in production.

`npm run test:e2e` is currently broken (it still expects the starter `Hello World!` route). Tracked as BE-051.

### Frontend

```bash
cd frontend
cp .env.example .env.local      # contract IDs + NEXT_PUBLIC_API_URL ending in /api
npm ci
npm run lint
npm run type-check
npm run build
npm run dev                     # http://localhost:3000
```

The frontend doesn't have a unit test runner yet (tracked as FE-001). Until it does, a frontend PR must pass `lint`, `type-check` and `build`, and include screenshots.

Deploy steps: see [quid-contract/README.md](./quid-contract/README.md) and the [Deploy Checklist](./README.md#deploy-checklist).

## Finding an issue

Labels:

- `good first issue`: small and well-scoped
- `help wanted`: needs an owner
- `priority`: MVP-critical
- Area: `frontend`, `backend`, `contracts`, `ci`, `design`
- Phase: `phase:foundation`, `phase:backend`, `phase:integration-fe-chain`, `phase:testing`, `phase:infra`

Comment on the issue before you start so work isn't duplicated. New issues should use the **Wave task** template (`.github/ISSUE_TEMPLATE/wave-task.md`).

## Branches

Name the branch `<area>/<issue-id>-<short-slug>`, all lowercase:

| Area prefix | Example |
|-------------|---------|
| `contracts/` | `contracts/sc-012-store-guardian-pause` |
| `backend/` | `backend/be-052-notifications-inbox-api` |
| `frontend/` | `frontend/fe-002-notification-bell` |
| `ci/` | `ci/ci-001-frontend-type-check` |
| `docs/` | `docs/docs-003-deploy-checklist` |
| `chore/` | `chore/repo-001-root-gitignore` |

If an issue gives a branch name in its Submission Guidelines, use that one.

## Pull requests

1. Open the PR against `main` and link the issue (`Closes #123`).
2. Title it as a [Conventional Commit](https://www.conventionalcommits.org/): `feat(backend): add notifications inbox api`.
3. Keep it to one issue. Don't mix refactors or renames into feature PRs.
4. **Tests are required.** Contract changes need `cargo test` coverage. Backend changes need Jest specs. Frontend logic needs tests once FE-001 lands; until then, explain how you checked it.
5. **UI changes need screenshots.** Include before and after, at desktop and mobile width (375px). Show loading, empty and error states if you touched them.
6. Paste the output (or a summary) of the commands you ran: `cargo test`, `npm run lint`, `npm run type-check`, `npm test`.
7. If you add an env var, add it to the package's `.env.example` and to the CI job in `.github/workflows/ci.yml`.
8. If you add a Prisma model or field, commit the migration under `backend/prisma/migrations/`.

A maintainer may close PRs that skip tests or screenshots without review.

## Coding standards

### Rust (contracts)

- Return `Result` with the contract's error enum instead of calling `.unwrap()` or `panic!` in contract logic.
- Use persistent storage with `extend_ttl` for per-record data. Keep instance storage for small config.
- Put new storage keys in the contract's `DataKey` enum.
- Run `cargo fmt` and `cargo clippy -- -D warnings` before pushing.

### TypeScript (frontend / backend)

- Strict TypeScript. Avoid `any`.
- Frontend: functional components and Tailwind. Use the existing brutalist tokens (`brutal-border`, `bg-brutal-*`) and keep dark mode working.
- Backend: Nest modules, DTOs validated with `class-validator`, routes under the global `/api` prefix.

## Design contributions

See [design/Design.md](./design/Design.md). Good design issues:

- Mission card states, the create-mission wizard, submit and review flows
- Empty, loading and error states
- Mobile hunter board
- Placeholders in `lib/upcoming-features.ts` (Proof-of-Test, Disputes, SEP-24 Cashout)

## Code of conduct

Be respectful. No harassment, hate speech or spam.
