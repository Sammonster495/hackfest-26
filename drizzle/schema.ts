import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const session = pgTable("session", {
  sessionToken: text().primaryKey().notNull(),
  userId: text().notNull(),
  expires: timestamp({ mode: "string" }).notNull(),
});

export const verificationToken = pgTable("verificationToken", {
  identifier: text().notNull(),
  token: text().notNull(),
  expires: timestamp({ mode: "string" }).notNull(),
});

export const dashboardSession = pgTable("dashboard_session", {
  sessionToken: text().primaryKey().notNull(),
  dashboardUserId: text("dashboard_user_id").notNull(),
  expires: timestamp({ mode: "string" }).notNull(),
});

export const eventParticipant = pgTable("event_participant", {
  id: text().primaryKey().notNull(),
  participantId: text("participant_id").notNull(),
  teamId: text("team_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const dashboardVerificationToken = pgTable(
  "dashboard_verification_token",
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ mode: "string" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.token, table.identifier],
      name: "dashboard_verification_token_identifier_token_pk",
    }),
  ],
);

export const authenticator = pgTable(
  "authenticator",
  {
    credentialId: text().notNull(),
    userId: text().notNull(),
    providerAccountId: text().notNull(),
    credentialPublicKey: text().notNull(),
    counter: integer().notNull(),
    credentialDeviceType: text().notNull(),
    credentialBackedUp: boolean().notNull(),
    transports: text(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.credentialId],
      name: "authenticator_userId_credentialID_pk",
    }),
    unique("authenticator_credentialID_unique").on(table.credentialId),
  ],
);

export const account = pgTable(
  "account",
  {
    userId: text().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text(),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    primaryKey({
      columns: [table.providerAccountId, table.provider],
      name: "account_provider_providerAccountId_pk",
    }),
  ],
);
