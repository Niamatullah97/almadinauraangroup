ALTER TABLE "race_days" ADD COLUMN "end_time" VARCHAR(5);

UPDATE "race_days" AS race_day
SET "end_time" = tournament."end_time"
FROM "tournaments" AS tournament
WHERE race_day."tournament_id" = tournament."id";

ALTER TABLE "race_days" ALTER COLUMN "end_time" SET NOT NULL;
