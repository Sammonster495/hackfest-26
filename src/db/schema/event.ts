import {
  boolean,
  index,
  integer,
  type PgColumn,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import {
  eventAudienceEnum,
  eventStatusEnum,
  eventTypeEnum,
  paymentStatusEnum,
} from "../enum";
import { eventUsers } from "./event-auth";

export const events = pgTable(
  "event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    date: timestamp("date").notNull().defaultNow(),
    venue: text("venue").notNull(),
    deadline: timestamp("deadline").notNull().defaultNow(),
    image: text("image").notNull(),
    type: eventTypeEnum("event_type").notNull().default("Solo"),
    status: eventStatusEnum("event_status").notNull().default("Draft"),
    audience: eventAudienceEnum("event_audience").notNull().default("Both"),
    maxTeams: integer("max_teams").notNull().default(0),
    minTeamSize: integer("min_team_size").notNull().default(1),
    maxTeamSize: integer("max_team_size").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("event_date_idx").on(table.date),
    index("event_deadline_idx").on(table.deadline),
  ],
);

export const eventParticipants = pgTable(
  "event_participant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references((): PgColumn => eventUsers.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => eventTeams.id, { onDelete: "cascade" }),
    isLeader: boolean("is_leader").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("event_participant_unique").on(table.eventId, table.userId),
    unique("team_participant_unique").on(table.teamId, table.userId),
    unique("event_team_leader_unique").on(
      table.eventId,
      table.isLeader,
      table.userId,
    ),
  ],
);

export const eventTeams = pgTable("event_teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("Pending"),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  attended: boolean("attended").notNull().default(false),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
