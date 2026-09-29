-- Link an off-chain mission row to its on-chain `quid-store` contract id.
-- Nullable so drafts and not-yet-published missions stay valid; a partial-free
-- UNIQUE index still permits many NULLs in Postgres, and guarantees that one
-- on-chain mission maps to at most one off-chain row.
ALTER TABLE "missions" ADD COLUMN "on_chain_id" TEXT;

CREATE UNIQUE INDEX "missions_on_chain_id_key" ON "missions"("on_chain_id");
