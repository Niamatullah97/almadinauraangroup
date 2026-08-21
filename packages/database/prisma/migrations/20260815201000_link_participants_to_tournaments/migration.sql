-- Link participants to a single tournament so each event has its own roster.

ALTER TABLE "participants" ADD COLUMN "tournament_id" UUID;

UPDATE "participants" AS p
SET "tournament_id" = sub."tournament_id"
FROM (
  SELECT DISTINCT ON ("participant_id")
    "participant_id",
    "tournament_id"
  FROM "tournament_registrations"
  ORDER BY "participant_id", "created_at" ASC
) AS sub
WHERE p."id" = sub."participant_id";

DO $$
DECLARE
  rec RECORD;
  new_id UUID;
BEGIN
  FOR rec IN
    SELECT
      tr."id" AS registration_id,
      tr."participant_id",
      tr."tournament_id"
    FROM "tournament_registrations" tr
    JOIN "participants" p ON p."id" = tr."participant_id"
    WHERE p."tournament_id" IS DISTINCT FROM tr."tournament_id"
  LOOP
    new_id := gen_random_uuid();

    INSERT INTO "participants" (
      "id",
      "tournament_id",
      "name",
      "father_name",
      "phone",
      "city",
      "address",
      "loft_name",
      "profile_image",
      "created_at",
      "updated_at",
      "deleted_at"
    )
    SELECT
      new_id,
      rec.tournament_id,
      "name",
      "father_name",
      "phone",
      "city",
      "address",
      "loft_name",
      "profile_image",
      "created_at",
      "updated_at",
      "deleted_at"
    FROM "participants"
    WHERE "id" = rec.participant_id;

    UPDATE "tournament_registrations"
    SET "participant_id" = new_id
    WHERE "id" = rec.registration_id;

    UPDATE "registration_pigeons"
    SET "participant_id" = new_id
    WHERE "registration_id" = rec.registration_id;

    UPDATE "pigeon_landing_times"
    SET "participant_id" = new_id
    WHERE "participant_id" = rec.participant_id
      AND "tournament_id" = rec.tournament_id;

    UPDATE "race_day_winners" w
    SET "participant_id" = new_id
    FROM "race_days" rd
    WHERE w."participant_id" = rec.participant_id
      AND w."race_day_id" = rd."id"
      AND rd."tournament_id" = rec.tournament_id;
  END LOOP;
END $$;

DELETE FROM "participants" WHERE "tournament_id" IS NULL;

ALTER TABLE "participants" ALTER COLUMN "tournament_id" SET NOT NULL;

DROP INDEX IF EXISTS "participants_phone_key";

CREATE UNIQUE INDEX "participants_tournament_id_phone_key" ON "participants"("tournament_id", "phone");
CREATE INDEX "participants_tournament_id_idx" ON "participants"("tournament_id");

ALTER TABLE "participants"
ADD CONSTRAINT "participants_tournament_id_fkey"
FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
