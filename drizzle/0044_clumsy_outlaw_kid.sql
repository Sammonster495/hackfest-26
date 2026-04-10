CREATE TABLE "github_repo" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" text NOT NULL,
	"github_repo_id" integer NOT NULL,
	"github_repo_name" text NOT NULL,
	"github_repo_full_name" text NOT NULL,
	"github_repo_url" text NOT NULL,
	"github_repo_html_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_team" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" text NOT NULL,
	"github_team_id" integer NOT NULL,
	"github_team_name" text NOT NULL,
	"github_team_slug" text NOT NULL,
	"github_team_url" text NOT NULL,
	"github_team_html_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_repo" ADD CONSTRAINT "github_repo_github_id_github_id_fk" FOREIGN KEY ("github_id") REFERENCES "public"."github"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_team" ADD CONSTRAINT "github_team_github_id_github_id_fk" FOREIGN KEY ("github_id") REFERENCES "public"."github"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github" ADD CONSTRAINT "github_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;