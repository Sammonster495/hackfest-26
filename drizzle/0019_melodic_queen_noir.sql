ALTER TABLE "event_participant" RENAME COLUMN "participant_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_participant_id_event_user_id_fk";
--> statement-breakpoint
ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_team_id_event_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "event_teams" DROP CONSTRAINT "event_teams_leader_id_event_user_id_fk";
--> statement-breakpoint
ALTER TABLE "event_teams" DROP CONSTRAINT "event_teams_event_id_event_id_fk";
--> statement-breakpoint
ALTER TABLE "event_participant" ADD COLUMN "event_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "event_participant" ADD COLUMN "is_leader" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_event_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."event_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_team_id_event_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."event_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" DROP COLUMN "leader_id";--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_unique" UNIQUE("event_id","user_id");--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "team_participant_unique" UNIQUE("team_id","user_id");--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_team_leader_unique" UNIQUE("event_id","is_leader","user_id");