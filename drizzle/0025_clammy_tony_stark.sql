ALTER TABLE "college_request" ADD COLUMN "requested_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "college_request" ADD COLUMN "approved_name" text;--> statement-breakpoint
ALTER TABLE "college_request" DROP COLUMN "name";