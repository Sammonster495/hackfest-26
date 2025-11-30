import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { paymentStatusEnum, teamStatusEnum } from "../enum";

export const teams = pgTable("team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  teamNumber: integer("team_number").unique(),
  teamStatus: teamStatusEnum("team_status").default("Not Selected"),
  paymentStatus: paymentStatusEnum("payment_status").default("Pending"),
  attended: boolean("attended").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
