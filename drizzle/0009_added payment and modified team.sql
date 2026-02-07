CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_name" text NOT NULL,
	"payment_type" text DEFAULT 'Hackfest' NOT NULL,
	"amount" text NOT NULL,
	"payment_status" "payment_status" DEFAULT 'Pending',
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"user_id" text,
	"team_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "leader_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_participant_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."participant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_leader_id_participant_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."participant"("id") ON DELETE no action ON UPDATE no action;