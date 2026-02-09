import { pgTable, text } from "drizzle-orm/pg-core";
import { teamProgressEnum } from "../enum";
import { teams } from "./team";

export const notSelected = pgTable("not_selected", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
});

export const semiSelected = pgTable("semi_selected", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
});

export const selected = pgTable("selected", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  teamProgress: teamProgressEnum("team_progress")
    .notNull()
    .default("PARTICIPATION"),
});
