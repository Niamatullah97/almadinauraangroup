-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN "single_nominated_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "registration_pigeons" ADD COLUMN "is_single_nominated" BOOLEAN NOT NULL DEFAULT false;
