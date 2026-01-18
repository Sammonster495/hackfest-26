import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { dashboardUsers } from "./rbac";

export const dashboardSessions = pgTable(
  "dashboard_session",
  {
    sessionToken: text("sessionToken").primaryKey(),
    dashboardUserId: text("dashboard_user_id")
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    index("dashboard_session_dashboard_user_id_idx").on(table.dashboardUserId),
    index("dashboard_session_expires_idx").on(table.expires),
  ],
);

export const dashboardVerificationTokens = pgTable(
  "dashboard_verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);
