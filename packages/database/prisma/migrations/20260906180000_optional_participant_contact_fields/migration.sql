-- Make ustaads, phone, and city optional. Empty phone strings become NULL
-- so the tournament+phone unique constraint does not collide.

UPDATE "participants" SET "phone" = NULL WHERE "phone" = '';
UPDATE "participants" SET "father_name" = NULL WHERE "father_name" = '';
UPDATE "participants" SET "city" = NULL WHERE "city" = '';

ALTER TABLE "participants" ALTER COLUMN "father_name" DROP NOT NULL;
ALTER TABLE "participants" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "participants" ALTER COLUMN "city" DROP NOT NULL;
