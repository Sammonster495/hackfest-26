import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { teams } from "./team";

export const githubs = pgTable("github", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
});

export const githubTeams = pgTable("github_team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  githubId: text("github_id")
    .notNull()
    .references(() => githubs.id, { onDelete: "cascade" }),

  githubTeamId: integer("github_team_id").notNull(),
  githubTeamName: text("github_team_name").notNull(),
  githubTeamSlug: text("github_team_slug").notNull(),
  githubTeamUrl: text("github_team_url").notNull(),
  githubTeamHtmlUrl: text("github_team_html_url").notNull(),
});

export const githubRepos = pgTable("github_repo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  githubId: text("github_id")
    .notNull()
    .references(() => githubs.id, { onDelete: "cascade" }),

  githubRepoId: integer("github_repo_id").notNull(),
  githubRepoName: text("github_repo_name").notNull(),
  githubRepoFullName: text("github_repo_full_name").notNull(),
  githubRepoUrl: text("github_repo_url").notNull(),
  githubRepoHtmlUrl: text("github_repo_html_url").notNull(),
});
