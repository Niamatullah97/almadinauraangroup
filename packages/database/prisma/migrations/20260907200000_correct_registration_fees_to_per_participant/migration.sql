-- Stored registration totals were fee × pigeon quota. Charge one entry fee per loft.

UPDATE "tournament_registrations"
SET
  "total_fee" = "entry_fee_per_pigeon",
  "paid_amount" = LEAST("paid_amount", "entry_fee_per_pigeon"),
  "payment_status" = CASE
    WHEN LEAST("paid_amount", "entry_fee_per_pigeon") <= 0 THEN 'PENDING'::"RegistrationPaymentStatus"
    WHEN LEAST("paid_amount", "entry_fee_per_pigeon") >= "entry_fee_per_pigeon" THEN 'PAID'::"RegistrationPaymentStatus"
    ELSE 'PARTIAL'::"RegistrationPaymentStatus"
  END,
  "updated_at" = NOW()
WHERE "deleted_at" IS NULL
  AND (
    "total_fee" <> "entry_fee_per_pigeon"
    OR "paid_amount" > "entry_fee_per_pigeon"
  );

UPDATE "registration_payments" AS p
SET "amount" = r."entry_fee_per_pigeon"
FROM "tournament_registrations" AS r
WHERE p."registration_id" = r."id"
  AND r."deleted_at" IS NULL
  AND p."notes" = 'Paid at registration'
  AND p."amount" <> r."entry_fee_per_pigeon";
