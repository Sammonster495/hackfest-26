CREATE TABLE "event_account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "event_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "event_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "event_verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_account" ADD CONSTRAINT "event_account_userId_event_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."event_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_session" ADD CONSTRAINT "event_session_userId_event_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."event_user"("id") ON DELETE cascade ON UPDATE no action;