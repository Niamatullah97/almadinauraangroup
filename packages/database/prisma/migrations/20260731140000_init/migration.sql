-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PigeonSex" AS ENUM ('COCK', 'HEN');

-- CreateEnum
CREATE TYPE "PigeonStatus" AS ENUM ('ACTIVE', 'RETIRED', 'DECEASED');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RaceDayStatus" AS ENUM ('PENDING', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pigeons" (
    "id" UUID NOT NULL,
    "ring_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sex" "PigeonSex" NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "birth_year" INTEGER NOT NULL,
    "owner_id" UUID NOT NULL,
    "status" "PigeonStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "pigeons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "city" VARCHAR(120) NOT NULL,
    "entry_fee" DECIMAL(10,2) NOT NULL,
    "total_pigeons_allowed" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "banner_image" VARCHAR(500),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "pigeon_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "bib_number" VARCHAR(20) NOT NULL,
    "arrival_time" TIMESTAMPTZ,
    "rank" INTEGER,
    "speed_mps" DECIMAL(10,4),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_days" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "race_date" DATE NOT NULL,
    "release_time" VARCHAR(5) NOT NULL,
    "release_location" VARCHAR(255) NOT NULL,
    "weather_notes" TEXT,
    "status" "RaceDayStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "race_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "father_name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "address" TEXT,
    "loft_name" VARCHAR(150) NOT NULL,
    "profile_image" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_registrations" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "pigeon_count" INTEGER NOT NULL,
    "entry_fee_per_pigeon" DECIMAL(10,2) NOT NULL,
    "total_fee" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" "RegistrationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "receipt_number" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_payments" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_pigeons" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "ring_number" VARCHAR(50) NOT NULL,
    "pigeon_number" INTEGER NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "gender" "PigeonSex" NOT NULL,
    "is_double_stamp" BOOLEAN NOT NULL DEFAULT false,
    "status" "PigeonStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "registration_pigeons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pigeon_landing_times" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "race_day_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "registration_pigeon_id" UUID NOT NULL,
    "landing_time" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "pigeon_landing_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "pigeons_ring_number_key" ON "pigeons"("ring_number");

-- CreateIndex
CREATE INDEX "pigeons_owner_id_idx" ON "pigeons"("owner_id");

-- CreateIndex
CREATE INDEX "pigeons_ring_number_idx" ON "pigeons"("ring_number");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournaments_start_date_idx" ON "tournaments"("start_date");

-- CreateIndex
CREATE INDEX "tournaments_created_by_idx" ON "tournaments"("created_by");

-- CreateIndex
CREATE INDEX "tournaments_slug_idx" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournament_entries_tournament_id_idx" ON "tournament_entries"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_entries_participant_id_idx" ON "tournament_entries"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_entries_tournament_id_pigeon_id_key" ON "tournament_entries"("tournament_id", "pigeon_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_entries_tournament_id_bib_number_key" ON "tournament_entries"("tournament_id", "bib_number");

-- CreateIndex
CREATE INDEX "race_days_tournament_id_idx" ON "race_days"("tournament_id");

-- CreateIndex
CREATE INDEX "race_days_status_idx" ON "race_days"("status");

-- CreateIndex
CREATE INDEX "race_days_race_date_idx" ON "race_days"("race_date");

-- CreateIndex
CREATE UNIQUE INDEX "race_days_tournament_id_race_date_key" ON "race_days"("tournament_id", "race_date");

-- CreateIndex
CREATE UNIQUE INDEX "participants_phone_key" ON "participants"("phone");

-- CreateIndex
CREATE INDEX "participants_name_idx" ON "participants"("name");

-- CreateIndex
CREATE INDEX "participants_city_idx" ON "participants"("city");

-- CreateIndex
CREATE INDEX "participants_loft_name_idx" ON "participants"("loft_name");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_registrations_receipt_number_key" ON "tournament_registrations"("receipt_number");

-- CreateIndex
CREATE INDEX "tournament_registrations_tournament_id_idx" ON "tournament_registrations"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_registrations_participant_id_idx" ON "tournament_registrations"("participant_id");

-- CreateIndex
CREATE INDEX "tournament_registrations_payment_status_idx" ON "tournament_registrations"("payment_status");

-- CreateIndex
CREATE INDEX "tournament_registrations_receipt_number_idx" ON "tournament_registrations"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_registrations_tournament_id_participant_id_key" ON "tournament_registrations"("tournament_id", "participant_id");

-- CreateIndex
CREATE INDEX "registration_payments_registration_id_idx" ON "registration_payments"("registration_id");

-- CreateIndex
CREATE INDEX "registration_pigeons_registration_id_idx" ON "registration_pigeons"("registration_id");

-- CreateIndex
CREATE INDEX "registration_pigeons_tournament_id_idx" ON "registration_pigeons"("tournament_id");

-- CreateIndex
CREATE INDEX "registration_pigeons_participant_id_idx" ON "registration_pigeons"("participant_id");

-- CreateIndex
CREATE INDEX "registration_pigeons_status_idx" ON "registration_pigeons"("status");

-- CreateIndex
CREATE UNIQUE INDEX "registration_pigeons_registration_id_pigeon_number_key" ON "registration_pigeons"("registration_id", "pigeon_number");

-- CreateIndex
CREATE UNIQUE INDEX "registration_pigeons_tournament_id_ring_number_key" ON "registration_pigeons"("tournament_id", "ring_number");

-- CreateIndex
CREATE INDEX "pigeon_landing_times_tournament_id_idx" ON "pigeon_landing_times"("tournament_id");

-- CreateIndex
CREATE INDEX "pigeon_landing_times_race_day_id_idx" ON "pigeon_landing_times"("race_day_id");

-- CreateIndex
CREATE INDEX "pigeon_landing_times_participant_id_idx" ON "pigeon_landing_times"("participant_id");

-- CreateIndex
CREATE INDEX "pigeon_landing_times_landing_time_idx" ON "pigeon_landing_times"("landing_time");

-- CreateIndex
CREATE UNIQUE INDEX "pigeon_landing_times_race_day_id_registration_pigeon_id_key" ON "pigeon_landing_times"("race_day_id", "registration_pigeon_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pigeons" ADD CONSTRAINT "pigeons_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_pigeon_id_fkey" FOREIGN KEY ("pigeon_id") REFERENCES "pigeons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_days" ADD CONSTRAINT "race_days_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_payments" ADD CONSTRAINT "registration_payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "tournament_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_pigeons" ADD CONSTRAINT "registration_pigeons_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "tournament_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_pigeons" ADD CONSTRAINT "registration_pigeons_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_pigeons" ADD CONSTRAINT "registration_pigeons_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pigeon_landing_times" ADD CONSTRAINT "pigeon_landing_times_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pigeon_landing_times" ADD CONSTRAINT "pigeon_landing_times_race_day_id_fkey" FOREIGN KEY ("race_day_id") REFERENCES "race_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pigeon_landing_times" ADD CONSTRAINT "pigeon_landing_times_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pigeon_landing_times" ADD CONSTRAINT "pigeon_landing_times_registration_pigeon_id_fkey" FOREIGN KEY ("registration_pigeon_id") REFERENCES "registration_pigeons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
