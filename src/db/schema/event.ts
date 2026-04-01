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
import { participants } from "./participant";
import { payment } from "./payment";
import { dashboardUsers } from "./rbac";

export const events = pgTable(
  "event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    from: timestamp("from").notNull().defaultNow(),
    to: timestamp("to").notNull().defaultNow(),
    priority: integer("priority").notNull().default(0),
    venue: text("venue").notNull(),
    deadline: timestamp("deadline").notNull().defaultNow(),
    image: text("image").notNull(),
    type: eventTypeEnum("event_type").notNull().default("Solo"),
    status: eventStatusEnum("event_status").notNull().default("Draft"),
    audience: eventAudienceEnum("event_audience").notNull().default("Both"),
    category: text("category").notNull().default("Technical"),
    amount: integer("amount").notNull().default(0),
    maxTeams: integer("max_teams").notNull().default(0),
    minTeamSize: integer("min_team_size").notNull().default(1),
    maxTeamSize: integer("max_team_size").notNull().default(1),
    registrationsOpen: boolean("registrations_open").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("event_from_idx").on(table.from),
    index("event_to_idx").on(table.to),
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
      .references((): PgColumn => participants.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => eventTeams.id, { onDelete: "cascade" }),
    isLeader: boolean("is_leader").notNull().default(false),
    attended: boolean("attended").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("event_participant_unique").on(table.eventId, table.userId),
    unique("team_participant_unique").on(table.teamId, table.userId),
  ],
);

export const eventTeams = pgTable("event_teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  paymentId: text("payment_id").references(() => payment.id, {
    onDelete: "set null",
  }),
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

export const eventOrganizers = pgTable("event_organizers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  organizerId: text("organizer_id")
    .notNull()
    .references(() => dashboardUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
