import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teams } from "./team";
import { tracks } from "./tracks";

export const ideaSubmission = pgTable(
  "idea_submission",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id)
      .unique(),
    pptUrl: text("ppt_url").notNull(),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("idea_submission_team_id_idx").on(table.teamId),
    index("idea_submission_track_id_idx").on(table.trackId),
  ],
);
