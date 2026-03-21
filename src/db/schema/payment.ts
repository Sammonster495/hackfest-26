import { type PgColumn, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { paymentStatusEnum, paymentType } from "../enum";
import { participants } from "./participant";

export const payment = pgTable("payment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paymentName: text("payment_name").notNull(),
  paymentType: paymentType("payment_type").notNull().default("HACKFEST"),
  amount: text("amount").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("Pending"),
  paymentScreenshotUrl: text("payment_screenshot_url"),
  paymentTransactionId: text("payment_transaction_id"),

  userId: text("user_id").references((): PgColumn => participants.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
