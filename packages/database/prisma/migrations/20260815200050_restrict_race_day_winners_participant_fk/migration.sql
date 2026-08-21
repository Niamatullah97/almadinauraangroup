-- DropForeignKey
ALTER TABLE "race_day_winners" DROP CONSTRAINT "race_day_winners_participant_id_fkey";

-- AddForeignKey
ALTER TABLE "race_day_winners" ADD CONSTRAINT "race_day_winners_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
