ALTER TABLE "team" ALTER COLUMN "team_status" SET DEFAULT 'Not Selected';--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "payment_status" SET DEFAULT 'Pending';--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;