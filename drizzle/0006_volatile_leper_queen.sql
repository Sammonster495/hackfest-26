CREATE TABLE "dashboard_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"dashboard_user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "dashboard_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "dashboard_session" ADD CONSTRAINT "dashboard_session_dashboard_user_id_dashboard_user_id_fk" FOREIGN KEY ("dashboard_user_id") REFERENCES "public"."dashboard_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dashboard_session_dashboard_user_id_idx" ON "dashboard_session" USING btree ("dashboard_user_id");--> statement-breakpoint
CREATE INDEX "dashboard_session_expires_idx" ON "dashboard_session" USING btree ("expires");