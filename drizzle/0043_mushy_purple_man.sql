ALTER TABLE "event_teams" DROP CONSTRAINT "event_teams_payment_id_payment_id_fk";
--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE set null ON UPDATE no action;