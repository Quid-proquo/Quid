-- BE-088 anchors
CREATE TABLE "anchors" (
    "domain" TEXT NOT NULL,
    "name" TEXT,
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assets" JSONB,
    "info" JSONB,
    "last_checked_at" TIMESTAMP(3),
    "healthy" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "anchors_pkey" PRIMARY KEY ("domain")
);

-- BE-085 webhook subscriptions
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "owner_address" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mission_id" TEXT,
    "secret_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "webhook_subscriptions_owner_address_idx" ON "webhook_subscriptions"("owner_address");

-- BE-065 duplicate candidates
CREATE TABLE "duplicate_candidates" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "candidate_of_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "kind" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duplicate_candidates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "duplicate_candidates_submission_id_idx" ON "duplicate_candidates"("submission_id");
CREATE INDEX "duplicate_candidates_candidate_of_id_idx" ON "duplicate_candidates"("candidate_of_id");
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_candidate_of_id_fkey" FOREIGN KEY ("candidate_of_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
