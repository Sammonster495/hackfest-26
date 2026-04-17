import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { genderEnum } from "../enum";
import { teams } from "./team";

export const dormitory = pgTable("dormitory", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  gender: genderEnum("gender").notNull(),
});

export const dormitoryTeams = pgTable(
  "dormitory_teams",
  {
    dormId: text("dormitory_id")
      .notNull()
      .references(() => dormitory.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.dormId, t.teamId] })],
);
