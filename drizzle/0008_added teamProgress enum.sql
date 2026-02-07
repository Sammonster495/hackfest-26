CREATE TYPE "public"."team_progress" AS ENUM('NOT_SELECTED', 'SEMI_SELECTED', 'SELECTED', 'TOP15', 'WINNER', 'RUNNER', 'SECOND_RUNNER', 'TRACK');
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "team_progress" "team_progress" DEFAULT 'NOT_SELECTED';