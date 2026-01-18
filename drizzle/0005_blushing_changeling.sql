CREATE TABLE "dashboard_user_role" (
	"id" text PRIMARY KEY NOT NULL,
	"dashboard_user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_user" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	CONSTRAINT "permission_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "role_permission_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "team" DROP CONSTRAINT "team_team_number_unique";--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId");--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID");--> statement-breakpoint
ALTER TABLE "dashboard_user_role" ADD CONSTRAINT "dashboard_user_role_dashboard_user_id_dashboard_user_id_fk" FOREIGN KEY ("dashboard_user_id") REFERENCES "public"."dashboard_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_user_role" ADD CONSTRAINT "dashboard_user_role_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dashboard_user_role_dashboard_user_id_idx" ON "dashboard_user_role" USING btree ("dashboard_user_id");--> statement-breakpoint
CREATE INDEX "dashboard_user_role_role_id_idx" ON "dashboard_user_role" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "dashboard_user_role_dashboard_user_id_is_active_idx" ON "dashboard_user_role" USING btree ("dashboard_user_id","is_active");--> statement-breakpoint
CREATE INDEX "dashboard_user_is_active_idx" ON "dashboard_user" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "role_permission_role_id_idx" ON "role_permission" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "role_is_active_idx" ON "roles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "role_is_system_role_idx" ON "roles" USING btree ("is_system_role");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "account_provider_idx" ON "account" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "authenticator_user_id_idx" ON "authenticator" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "session" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "team_payment_status_idx" ON "team" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "team_is_completed_idx" ON "team" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "team_attended_idx" ON "team" USING btree ("attended");--> statement-breakpoint
CREATE INDEX "college_state_idx" ON "college" USING btree ("state");--> statement-breakpoint
CREATE INDEX "participant_college_id_idx" ON "participant" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "participant_team_id_idx" ON "participant" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "participant_is_registration_complete_idx" ON "participant" USING btree ("is_registration_complete");--> statement-breakpoint
CREATE INDEX "participant_github_idx" ON "participant" USING btree ("github");--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "team_number";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "team_status";--> statement-breakpoint
ALTER TABLE "participant" DROP COLUMN "attended";