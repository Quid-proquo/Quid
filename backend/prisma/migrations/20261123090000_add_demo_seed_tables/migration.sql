-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CashoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('WEEKLY', 'SEASON');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "seed_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "notifications_seed_key_key" ON "notifications"("seed_key");

-- CreateTable
CREATE TABLE "proofs" (
    "id" TEXT NOT NULL,
    "seed_key" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "hunter_address" TEXT NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'PENDING',
    "cid" TEXT NOT NULL,
    "verdict" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "seed_key" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "raised_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashouts" (
    "id" TEXT NOT NULL,
    "seed_key" TEXT NOT NULL,
    "hunter_address" TEXT NOT NULL,
    "amount" DECIMAL(39, 0) NOT NULL,
    "asset" TEXT NOT NULL DEFAULT 'XLM',
    "status" "CashoutStatus" NOT NULL DEFAULT 'PENDING',
    "tx_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "seed_key" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "display_name" TEXT,
    "period" "LeaderboardPeriod" NOT NULL,
    "rank" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "missions_completed" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proofs_seed_key_key" ON "proofs"("seed_key");

-- CreateIndex
CREATE INDEX "proofs_submission_id_idx" ON "proofs"("submission_id");

-- CreateIndex
CREATE INDEX "proofs_status_idx" ON "proofs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_seed_key_key" ON "disputes"("seed_key");

-- CreateIndex
CREATE INDEX "disputes_submission_id_idx" ON "disputes"("submission_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cashouts_seed_key_key" ON "cashouts"("seed_key");

-- CreateIndex
CREATE INDEX "cashouts_hunter_address_idx" ON "cashouts"("hunter_address");

-- CreateIndex
CREATE INDEX "cashouts_status_idx" ON "cashouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cashouts_tx_hash_key" ON "cashouts"("tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_seed_key_key" ON "leaderboard_entries"("seed_key");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_period_rank_key" ON "leaderboard_entries"("period", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_period_address_key" ON "leaderboard_entries"("period", "address");

-- CreateIndex
CREATE INDEX "leaderboard_entries_period_rank_idx" ON "leaderboard_entries"("period", "rank");

-- AddForeignKey
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashouts" ADD CONSTRAINT "cashouts_hunter_address_fkey" FOREIGN KEY ("hunter_address") REFERENCES "users"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
