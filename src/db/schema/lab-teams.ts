import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { lab } from "./labs";
import { teams } from "./team";

export const labTeams = pgTable(
  "lab_teams",
  {
    labId: uuid("lab_id")
      .notNull()
      .references(() => lab.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.labId, t.teamId] })],
);
