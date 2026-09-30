-- Issue #316: align Prisma Mission/Submission with quid-store on-chain fields.
-- See docs/chain-mapping.md for the field-by-field mapping.

-- ── missions ─────────────────────────────────────────────────────────────────
ALTER TABLE "missions" ADD COLUMN "on_chain_id" BIGINT;
CREATE UNIQUE INDEX "missions_on_chain_id_key" ON "missions"("on_chain_id");
CREATE INDEX "missions_on_chain_id_idx" ON "missions"("on_chain_id");

ALTER TABLE "missions" ADD COLUMN "min_asset_token" TEXT;
ALTER TABLE "missions" ADD COLUMN "min_asset_amount" TEXT NOT NULL DEFAULT '0';
ALTER TABLE "missions" ADD COLUMN "escrow_tx_hash" TEXT;

-- Backfill ai_summary default for rows created before the column had a default.
ALTER TABLE "missions" ALTER COLUMN "ai_summary" SET DEFAULT '';

-- ── mission status: add CREATED variant (MissionStatus::Created on-chain) ────
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'CREATED' AFTER 'OPEN';

-- ── submissions ──────────────────────────────────────────────────────────────
ALTER TABLE "submissions" ADD COLUMN "stake_amount" TEXT NOT NULL DEFAULT '0';
ALTER TABLE "submissions" ADD COLUMN "stake_token" TEXT;
ALTER TABLE "submissions" ADD COLUMN "stake_tx_hash" TEXT;
ALTER TABLE "submissions" ADD COLUMN "submitted_at_ledger" BIGINT;
