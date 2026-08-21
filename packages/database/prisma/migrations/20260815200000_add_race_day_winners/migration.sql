-- CreateEnum
CREATE TYPE "RaceWinnerCategory" AS ENUM ('FIRST', 'LAST', 'AVERAGE');

-- CreateTable
CREATE TABLE "race_day_winners" (
    "id" UUID NOT NULL,
    "race_day_id" UUID NOT NULL,
    "category" "RaceWinnerCategory" NOT NULL,
    "participant_id" UUID NOT NULL,
    "registration_pigeon_id" UUID,
    "value_ms" INTEGER NOT NULL,
    "landing_clock_time" VARCHAR(16),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "race_day_winners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "race_day_winners_race_day_id_category_key" ON "race_day_winners"("race_day_id", "category");

-- CreateIndex
CREATE INDEX "race_day_winners_race_day_id_idx" ON "race_day_winners"("race_day_id");

-- CreateIndex
CREATE INDEX "race_day_winners_participant_id_idx" ON "race_day_winners"("participant_id");

-- AddForeignKey
ALTER TABLE "race_day_winners" ADD CONSTRAINT "race_day_winners_race_day_id_fkey" FOREIGN KEY ("race_day_id") REFERENCES "race_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_day_winners" ADD CONSTRAINT "race_day_winners_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_day_winners" ADD CONSTRAINT "race_day_winners_registration_pigeon_id_fkey" FOREIGN KEY ("registration_pigeon_id") REFERENCES "registration_pigeons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
