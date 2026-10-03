<img width="161" height="87" alt="Quid" src="https://github.com/user-attachments/assets/70d1ce77-641c-445b-911d-971a8908593d" />

# Quid

Quid is a feedback marketplace on **Stellar / Soroban**. Founders lock USDC/XLM bounties for honest dApp feedback; hunters earn rewards for useful submissions.

## The problem

- Founders struggle to find real users to test their dApps.
- Users have little incentive to write detailed, constructive feedback.
- Discord feedback is often spam or lost in noise.

## The solution

1. **Founders** create a Mission and escrow rewards in `quid-store`.
2. **Hunters** submit feedback (text / screenshots) via IPFS; only the CID goes on-chain.
3. **Payout** happens from the smart contract when the founder approves.

### Core features

| Feature | Description |
|---------|-------------|
| **Bounty Vault** | Rewards locked on-chain when a mission is created |
| **Hybrid storage** | Feedback on IPFS; CID on Soroban |
| **Asset gating** | Optional token/NFT holdings required to submit |
| **Reputation** | On-chain attestations / profiles for quality contributors |

## Repository layout

```text
Quid/
├── frontend/          # Next.js app (Freighter, creator + hunter UI)
├── backend/           # NestJS API (auth, missions index, upload, indexer)
├── quid-contract/     # Soroban contracts (store, reputation, milestone escrow, dispute)
└── CONTRIBUTING.md
```

## Architecture

```text
Freighter wallet
      │
      ▼
Frontend (Next.js) ──────► Backend (NestJS + Postgres)
      │                         │
      │ create / submit / pay   │ index events, drafts, IPFS
      ▼                         ▼
Soroban contracts ◄─────────────┘
(quid-store, quid-reputation, quid-milestone-escrow, quid-dispute)
      │
      ▼
IPFS (feedback blobs; CID stored on-chain)
```

**Current status (honest):** Contracts are implemented and deployable. Frontend has Freighter + Horizon wiring and polished UI shells, but marketplace data is still mostly mock and contract IDs are not invoked yet. Backend has SEP-10 auth, mission reads/drafts, and stubs for IPFS upload + chain indexer. The MVP gap is wiring **create → submit → approve → payout** end-to-end.

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js, React, TypeScript, Tailwind, shadcn/ui, Freighter, Stellar SDK |
| Backend | NestJS, Prisma, PostgreSQL, SEP-10 / JWT |
| Contracts | Rust, Soroban SDK 23, Stellar CLI |
| Payments | USDC / XLM on Stellar |

## Port & Service Map

| Service | Port | Default URL | Purpose |
|---------|------|-------------|---------|
| **Frontend** | `3000` | `http://localhost:3000` | Next.js web application |
| **Backend API** | `3001` | `http://localhost:3001/api` | NestJS REST API (all routes are prefixed with `/api`) |
| **PostgreSQL** | `5432` | `localhost:5432` | Postgres database |
| **Stellar Testnet Horizon** | Remote | `https://horizon-testnet.stellar.org` | Stellar Horizon testnet endpoint |
| **Stellar Testnet RPC** | Remote | `https://soroban-testnet.stellar.org` | Soroban RPC testnet endpoint |

---

## Deploy Checklist

This is the canonical order for a fresh local environment. Each step links to
the detailed section below; contract-specific variants live in
[quid-contract/README.md](./quid-contract/README.md).

- [ ] **1. Prerequisites** — Node 18+, Docker, Stellar CLI, Freighter on Testnet.
- [ ] **2. Database** — start Postgres and apply Prisma migrations.
- [ ] **3. Build contracts** — `stellar contract build` (produces the `*.wasm` files).
- [ ] **4. Deploy the three core contracts** — `quid-store`, `quid-reputation`,
      `quid-milestone-escrow`. Keep the printed `C...` IDs; you need them twice.
- [ ] **5. Initialize reputation** — one-time `initialize --admin <deployer>` call
      against `quid-reputation`. Skipping this leaves reputation read-only
      (`get_admin` reverts) and is the most common first-deploy failure.
- [ ] **6. Configure the backend** — `backend/.env` from `backend/.env.example`:
      `DATABASE_URL`, `PORT`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`,
      `STELLAR_SERVER_SECRET`, `HOME_DOMAIN`, `WEB_AUTH_DOMAIN`,
      `STELLAR_NETWORK`.
- [ ] **7. Configure the frontend** — `frontend/.env.local` from
      `frontend/.env.example`: the three contract IDs from step 4, plus
      `NEXT_PUBLIC_SOROBAN_RPC_URL`, `NEXT_PUBLIC_HORIZON_URL`,
      `NEXT_PUBLIC_NATIVE_TOKEN_ID`, and `NEXT_PUBLIC_API_URL`
      (must include the `/api` suffix).
- [ ] **8. Verify** — backend `GET /api/health` returns `200`, then load
      `http://localhost:3000` with Freighter connected to Testnet.

> Never commit a filled `.env` / `.env.local`. Both templates contain
> placeholders only, and `.env*` files are gitignored.

---

## Full-Stack Local Demo Guide

Follow this step-by-step guide to run the entire Quid stack locally in under an
hour. It follows the same order as the [Deploy Checklist](#deploy-checklist)
above.

### 1. Prerequisites

- **Node.js**: v18 or v20+ (`node --version`)
- **Docker & Docker Compose**: For running PostgreSQL (`docker compose version`)
- **Stellar CLI**: For building and deploying Soroban contracts (`stellar --version`)
- **Freighter Wallet**: Browser extension installed ([freighter.app](https://www.freighter.app/))

---

### 2. Database Setup (PostgreSQL)

Start the local PostgreSQL container:

```bash
cd backend
docker compose up -d
```

Verify that Postgres is running on port `5432`:

```bash
docker compose ps
# DB accessible at: postgresql://quid:quid@localhost:5432/quid_dev?schema=public
```

---

### 3. Backend API Setup

Configure environment variables and start the NestJS backend on port `3001`:

```bash
cd backend

# Create environment file from template
cp .env.example .env
```

Ensure `backend/.env` contains:

```env
DATABASE_URL="postgresql://quid:quid@localhost:5432/quid_dev?schema=public"
PORT=3001
JWT_SECRET="dev-jwt-secret-key-change-in-production"
# Comma-separated allowlist. Unset falls back to http://localhost:3000.
CORS_ALLOWED_ORIGINS=http://localhost:3000
STELLAR_SERVER_SECRET="SBAY...YOUR_SERVER_SECRET_KEY"
HOME_DOMAIN="localhost"
WEB_AUTH_DOMAIN="localhost"
STELLAR_NETWORK="Test SDF Network ; September 2015"
```

> **Tip:** You can generate a random Stellar keypair for `STELLAR_SERVER_SECRET` using `stellar keys generate server-key --network testnet --as-secret`.

Install dependencies, run database migrations, and start the development server:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Verify backend health at [http://localhost:3001/api/health](http://localhost:3001/api/health)
— every backend route sits behind the `/api` prefix.

---

### 4. Smart Contracts & Testnet Deployment

To interact with real on-chain contracts on Stellar Testnet:

1. Generate and fund a deployer identity:
   ```bash
   stellar keys generate alice --network testnet --as-secret
   stellar keys fund alice --network testnet
   ```

2. **Build** every contract:
   ```bash
   cd quid-contract
   stellar contract build
   ```

3. **Deploy the three core contracts** (in this order — the store is the vault
   the others attach to):
   ```bash
   # Deploy quid-store
   STORE_ID=$(stellar contract deploy \
     --wasm target/wasm32v1-none/release/quid_store.wasm \
     --source alice \
     --network testnet)
   echo "STORE_ID: $STORE_ID"

   # Deploy quid-reputation
   REP_ID=$(stellar contract deploy \
     --wasm target/wasm32v1-none/release/quid_reputation.wasm \
     --source alice \
     --network testnet)
   echo "REP_ID: $REP_ID"

   # Deploy quid-milestone-escrow
   MILESTONE_ID=$(stellar contract deploy \
     --wasm target/wasm32v1-none/release/quid_milestone_escrow.wasm \
     --source alice \
     --network testnet)
   echo "MILESTONE_ID: $MILESTONE_ID"
   ```

4. **Initialize reputation** (one-time; without it `get_admin` and every
   attestation call revert):
   ```bash
   stellar contract invoke \
     --id $REP_ID \
     --source alice \
     --network testnet \
     -- initialize --admin alice
   ```

Write the three IDs down — step 7 needs them.

*(For local testing without deploying contracts, you can use the placeholder IDs provided in `frontend/.env.example`.)*

#### Reward tokens to use on testnet

When you create a mission, `reward_token` must be a **Stellar Asset Contract (SAC)
address**, not a classic `CODE:ISSUER` pair. Use these verified testnet values:

| Asset | SAC contract id (`reward_token`) | How to get testnet funds |
|-------|------------------------------------|---------------------------|
| XLM (native) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | Friendbot — `stellar keys fund <ADDRESS> --network testnet` |
| USDC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` | [Circle testnet faucet](https://faucet.circle.com/), then add a trustline to issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

Notes:

- **Native XLM is the easy path for local testing** — Friendbot funds it directly
  and it needs no trustline.
- **USDC must be the official Circle testnet asset** (issuer ending `FLA5`).
  Testnet is full of unverified lookalike `USDC` assets that deploy fine and
  then fail to settle.
- To check any SAC id before using it, call `name` on it and confirm it returns
  the asset you expect. See
  [`quid-contract/README.md`](quid-contract/README.md#reward-tokens-testnet) for
  the full table, the trustline step, and how to resolve other SAC ids.

---

### 5. Freighter Wallet Setup

1. Open the **Freighter** browser extension.
2. In Settings, ensure the network is set to **Testnet** (`Test SDF Network ; September 2015`).
3. Fund your Freighter wallet address with testnet XLM via Friendbot at [Stellar Laboratory](https://laboratory.stellar.org/#account-creator) or by running:
   ```bash
   stellar keys fund <YOUR_FREIGHTER_PUBLIC_KEY> --network testnet
   ```

---

### 6. Frontend Setup

Configure environment variables and start Next.js on port `3000`:

```bash
cd frontend

# Copy template configuration
cp .env.example .env.local
```

Edit `frontend/.env.local` to match your backend port (`3001`) and the contract
IDs from step 4. `.env.example` is the authoritative list:

```env
# Contract IDs from step 4
NEXT_PUBLIC_QUID_STORE_ID=<STORE_ID_OR_PLACEHOLDER>
NEXT_PUBLIC_QUID_REPUTATION_ID=<REP_ID_OR_PLACEHOLDER>
NEXT_PUBLIC_QUID_MILESTONE_ID=<MILESTONE_ID_OR_PLACEHOLDER>

# Stellar network
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_FRIENDBOT_URL=https://friendbot.stellar.org
# Asset used for bounties/payouts; the Soroban contract address, not "XLM".
NEXT_PUBLIC_NATIVE_TOKEN_ID=<NATIVE_TOKEN_CONTRACT_ID_OR_PLACEHOLDER>

# Backend API — the /api suffix is required (backend sets a global prefix)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

> `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so
> rebuild (or restart the dev server) after changing them.

Install dependencies and start the Next.js development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Troubleshooting & Common Pitfalls

### 1. Port Conflicts & CORS Errors
- **Issue:** Frontend shows network/CORS error when calling API (`http://localhost:3001`).
- **Fix:** Verify backend is running on port `3001` (check `PORT=3001` in `backend/.env`). If backend runs on port `3000` by accident, it will collide with Next.js. CORS is **allowlist-based**: with `CORS_ALLOWED_ORIGINS` unset only `http://localhost:3000` is allowed, so add your frontend origin (comma-separated) if you serve it elsewhere.

### 2. Freighter Network Mismatch or Unfunded Account
- **Issue:** Freighter transactions fail or reject immediately.
- **Fix:**
  - Verify Freighter network is set to **Testnet** (not Mainnet or Futurenet).
  - Ensure the active account has sufficient testnet XLM for transaction fees and minimum reserve balances.

### 3. PostgreSQL / Prisma Connection Refused
- **Issue:** `PrismaClientInitializationError: Can't reach database server at localhost:5432`.
- **Fix:**
  - Ensure Docker container is running: `cd backend && docker compose ps`.
  - Restart container if needed: `docker compose down && docker compose up -d`.
  - Check database credentials in `backend/.env` match `docker-compose.yml` (`quid:quid@localhost:5432/quid_dev`).

### 4. Contract Invocation Errors
- **Issue:** Contract call reverts or contract not found.
- **Fix:** Ensure contract IDs in `frontend/.env.local` match the exact addresses output during `stellar contract deploy` on Testnet (starting with `C...`).

### 5. Reputation Calls Revert
- **Issue:** `get_admin` / `issue_attestation` reverts with an authorization or state error.
- **Fix:** `quid-reputation` is uninitialized until you run `initialize --admin <deployer>` (step 5 of the [Deploy Checklist](#deploy-checklist)). It can only be initialized once per deployment.

## Roles

### Founders (creators)

Create a mission (title, dApp URL, reward per hunter, max participants), escrow funds, review submissions, approve payouts.

### Hunters (users)

Browse the mission board, submit feedback + proof, get paid in USDC/XLM when approved.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Pick issues labeled `good first issue`, `help wanted`, or `priority`.

## License

See the repository license file.
