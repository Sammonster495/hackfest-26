ALTER TABLE "event_participant" RENAME COLUMN "event_id" TO "team_id";--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_event_id_event_id_fk";
--> statement-breakpoint
ALTER TABLE "event_teams" ADD COLUMN "event_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_team_id_event_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."event_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;