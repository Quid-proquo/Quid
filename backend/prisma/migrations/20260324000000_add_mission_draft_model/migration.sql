-- CreateTable
CREATE TABLE "mission_drafts" (
    "id" TEXT NOT NULL,
    "owner_address" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mission_drafts_owner_address_updated_at_idx" ON "mission_drafts"("owner_address", "updated_at");

-- AddForeignKey
ALTER TABLE "mission_drafts" ADD CONSTRAINT "mission_drafts_owner_address_fkey" FOREIGN KEY ("owner_address") REFERENCES "users"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

