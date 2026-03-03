ALTER TABLE "event" RENAME COLUMN "hf_amount" TO "amount";--> statement-breakpoint
ALTER TABLE "event" DROP COLUMN "college_amount";--> statement-breakpoint
ALTER TABLE "event" DROP COLUMN "non_college_amount";