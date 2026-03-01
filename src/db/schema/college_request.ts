import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { collegeRequestStatusEnum, stateEnum } from "../enum";

export const collegeRequests = pgTable(
  "college_request",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requested_name: text("requested_name").notNull(),
    approved_name: text("approved_name"),
    state: stateEnum("state").notNull(),
    status: collegeRequestStatusEnum("status").default("Pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index("college_request_state_idx").on(table.state)],
);
