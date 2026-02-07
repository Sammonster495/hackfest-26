import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { paymentStatusEnum } from "../enum";
import { participants } from "./participant";
import { teams } from "./team";

export const payment = pgTable("payment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paymentName: text("payment_name").notNull(),
  paymentType: text("payment_type").notNull().default("Hackfest"),
  amount: text("amount").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("Pending"),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),

  userId: text("user_id").references(() => participants.id),
  teamId: text("team_id").references(() => teams.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
