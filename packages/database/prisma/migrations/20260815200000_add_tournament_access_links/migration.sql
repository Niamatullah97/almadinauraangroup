-- CreateEnum
CREATE TYPE "AccessLinkExpiryPreset" AS ENUM ('TODAY', 'TOMORROW', 'DAYS_7', 'MONTH', 'CUSTOM');

-- CreateTable
CREATE TABLE "tournament_access_links" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "secret_key_hash" VARCHAR(128) NOT NULL,
    "expiry_preset" "AccessLinkExpiryPreset" NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tournament_access_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_access_links_token_key" ON "tournament_access_links"("token");

-- CreateIndex
CREATE INDEX "tournament_access_links_tournament_id_idx" ON "tournament_access_links"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_access_links_expires_at_idx" ON "tournament_access_links"("expires_at");

-- AddForeignKey
ALTER TABLE "tournament_access_links" ADD CONSTRAINT "tournament_access_links_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_access_links" ADD CONSTRAINT "tournament_access_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
