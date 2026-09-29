# Quid Backend

NestJS API that supports Quid off-chain: wallet auth (SEP-10), mission indexing/drafts, file upload (IPFS — planned), and a Soroban event indexer (scaffold).

## Why this exists

Smart contracts hold escrow and truth for payouts. The backend makes the product usable:

- Fast mission list / search / filter (Postgres)
- Draft missions before on-chain publish
- Pin feedback media to IPFS and return CIDs
- Sync on-chain events into the DB for dashboards

The frontend should call this API for browse/auth/upload; Freighter should call contracts for create / submit / pay.

## Stack

- NestJS 11 + TypeScript
- Prisma 7 + PostgreSQL 15
- Passport JWT + Stellar SDK (SEP-10)
- `@nestjs/schedule` (indexer cron)

## What’s working

| Feature | Status |
|---------|--------|
| `GET /api/health` | Live |
| SEP-10 challenge + verify → JWT | Live |
| Mission list / detail / `me` / submissions (read) | Live |
| Mission lookup by on-chain id (`onChainId`) | Live |
| Mission drafts (`POST /api/missions/drafts`) | Live |
| Upload endpoints | Stub (acks bytes/JSON only — no IPFS) |
| Chain indexer cron | Scaffold (checkpoint only — no event sync) |

## What’s missing (MVP gaps)

- Real IPFS / Pinata (or similar) pinning → return CID
- Indexer: poll `quid-store` events → upsert missions/submissions
- Attach a published on-chain mission to its off-chain row (the `onChainId` column and lookup route now exist; the publish call itself is still frontend work)
- Create submission / approve / reject API flows synced with chain
- Hardening: rate limits, locked-down CORS, production secrets
- Frontend not wired to this API yet

## Setup

### Prerequisites

- Node.js 18+
- Docker (Postgres)

### Database

```bash
cd backend
docker compose up -d
```

Starts Postgres on `localhost:5432` (`quid` / `quid` / `quid_dev`).

### Env

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `PORT` | API port (default `3001` in `.env.example`) |
| `JWT_SECRET` | JWT signing secret |
| `STELLAR_SERVER_SECRET` | Server keypair secret for SEP-10 |
| `HOME_DOMAIN` / `WEB_AUTH_DOMAIN` | SEP-10 domains |
| `STELLAR_NETWORK` | Network passphrase (testnet by default) |
| `RPC_URL` / `CONTRACT_ID` | For indexer (when implemented) |

Generate a Stellar keypair for `STELLAR_SERVER_SECRET` (keep it server-side only).

### Install & run

```bash
npm install
npm run prisma:migrate
npm run start:dev
```

API base: [http://localhost:3001/api](http://localhost:3001/api) (all routes carry the `/api` prefix)

## HTTP surface

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/auth/challenge?address=` | No | SEP-10 challenge |
| `POST` | `/api/auth/verify` | No | Returns JWT |
| `GET` | `/api/missions` | No | List / filter |
| `GET` | `/api/missions/me` | JWT | Caller’s missions |
| `GET` | `/api/missions/on-chain/:onChainId` | No | Detail by `quid-store` contract id |
| `GET` | `/api/missions/:id` | No | Detail |
| `GET` | `/api/missions/:id/submissions` | JWT | Owner only |
| `POST` | `/api/missions/drafts` | JWT | Save draft |
| `POST` | `/api/upload` | JWT | Stub |
| `POST` | `/api/upload/json` | JWT | Stub |

## Scripts

```bash
npm run start:dev       # watch mode
npm run build
npm run start:prod
npm run test
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Project layout

```text
backend/
├── docker-compose.yml
├── prisma/                 # schema + migrations
└── src/
    ├── auth/               # SEP-10 + JWT
    ├── missions/
    ├── upload/             # stub
    ├── indexer/            # scaffold
    └── prisma/
```

## Related docs

- Root: [../README.md](../README.md)
- Frontend: [../frontend/README.md](../frontend/README.md)
- Contracts: [../quid-contract/README.md](../quid-contract/README.md)
