-- First, drop the team_progress column from team table if it exists
ALTER TABLE "team" DROP COLUMN IF EXISTS "team_progress";
--> statement-breakpoint
-- Drop the old enum type
DROP TYPE IF EXISTS "public"."team_progress";
--> statement-breakpoint
-- Create the new enum type with updated values
CREATE TYPE "public"."team_progress" AS ENUM('WINNER', 'RUNNER', 'SECOND_RUNNER', 'TRACK', 'PARTICIPATION');
--> statement-breakpoint
CREATE TABLE "not_selected" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "selected" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"team_progress" "team_progress" DEFAULT 'PARTICIPATION' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semi_selected" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "not_selected" ADD CONSTRAINT "not_selected_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selected" ADD CONSTRAINT "selected_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semi_selected" ADD CONSTRAINT "semi_selected_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;

