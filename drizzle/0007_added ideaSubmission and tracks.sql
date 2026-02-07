CREATE TABLE "idea_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"ppt_url" text NOT NULL,
	"track_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "idea_submission_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "idea_submission" ADD CONSTRAINT "idea_submission_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_submission" ADD CONSTRAINT "idea_submission_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idea_submission_team_id_idx" ON "idea_submission" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idea_submission_track_id_idx" ON "idea_submission" USING btree ("track_id");