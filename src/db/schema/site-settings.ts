import { boolean, pgTable, text } from "drizzle-orm/pg-core";

export const siteSettings = pgTable("site-settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  registrationsOpen: boolean("registrations_open").default(false),
  resultsOut: boolean("results_out").default(false),
  paymentsOpen: boolean("payment_open").default(false),
});
