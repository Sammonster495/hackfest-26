ALTER TABLE "event_account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_user" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_verification_token" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "event_account" CASCADE;--> statement-breakpoint
DROP TABLE "event_session" CASCADE;--> statement-breakpoint
DROP TABLE "event_user" CASCADE;--> statement-breakpoint
DROP TABLE "event_verification_token" CASCADE;--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_participant_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;