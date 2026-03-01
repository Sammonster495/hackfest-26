CREATE TYPE "public"."college_request_status" AS ENUM('Pending', 'Approved', 'Rejected');
--> statement-breakpoint
CREATE TABLE "college_request" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" "state" NOT NULL,
	"status" "college_request_status" DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "college_request_state_idx" ON "college_request" USING btree ("state");

