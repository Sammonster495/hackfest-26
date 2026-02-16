CREATE TABLE "event_organizers" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"organizer_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "event_participant" ADD COLUMN "attended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "category" text DEFAULT 'Technical' NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "hf_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "college_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "non_college_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "event_user_id" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "event_team_id" text;--> statement-breakpoint
ALTER TABLE "dashboard_user" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "dashboard_user" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_organizer_id_dashboard_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."dashboard_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_event_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."event_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_team_id_event_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."event_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_event_user_id_event_participant_id_fk" FOREIGN KEY ("event_user_id") REFERENCES "public"."event_participant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_event_team_id_event_teams_id_fk" FOREIGN KEY ("event_team_id") REFERENCES "public"."event_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" DROP COLUMN "leader_id";--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_unique" UNIQUE("event_id","user_id");--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "team_participant_unique" UNIQUE("team_id","user_id");--> statement-breakpoint
ALTER TABLE "dashboard_user" ADD CONSTRAINT "dashboard_user_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "dashboard_user" ADD CONSTRAINT "dashboard_user_phone_unique" UNIQUE("phone");