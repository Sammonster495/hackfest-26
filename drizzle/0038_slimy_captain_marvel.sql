CREATE TYPE "public"."payment_type" AS ENUM('HACKFEST', 'EVENT');--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payment_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payment_event_user_id_event_participant_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payment_event_team_id_event_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "payment_type" SET DEFAULT 'HACKFEST'::"public"."payment_type";--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "payment_type" SET DATA TYPE "public"."payment_type" USING "payment_type"::"public"."payment_type";--> statement-breakpoint
ALTER TABLE "event_teams" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "event_user_id";--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "event_team_id";