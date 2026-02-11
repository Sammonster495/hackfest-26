import {
  boolean,
  index,
  integer,
  type PgColumn,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { paymentStatusEnum } from "../enum";
import { participants } from "./participant";

export const events = pgTable(
  "event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    date: text("date").notNull(),
    image: text("image").notNull(),
    // HACK: SOLO/TEAM event can be determined by team size
    teamSize: integer("team_size").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("event_date_idx").on(table.date),
    index("event_team_size_idx").on(table.teamSize),
  ],
);

export const eventParticipants = pgTable("event_participant", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  participantId: text("participant_id")
    .notNull()
    .references((): PgColumn => participants.id),
  teamId: text("team_id")
    .notNull()
    .references(() => eventTeams.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Table for event teams
export const eventTeams = pgTable("event_teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("Pending"),
  leaderId: text("leader_id")
    .notNull()
    .references((): PgColumn => participants.id),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  attended: boolean("attended").notNull().default(false),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
