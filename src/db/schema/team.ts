import {
  boolean,
  index,
  type PgColumn,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { paymentStatusEnum } from "../enum";
import { participants } from "./participant";

export const teams = pgTable(
  "team",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    paymentStatus: paymentStatusEnum("payment_status").default("Pending"),
    leaderId: text("leader_id")
      .notNull()
      .references((): PgColumn => participants.id),
    attended: boolean("attended").notNull().default(false),
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("team_payment_status_idx").on(table.paymentStatus),
    index("team_is_completed_idx").on(table.isCompleted),
    index("team_attended_idx").on(table.attended),
  ],
);
