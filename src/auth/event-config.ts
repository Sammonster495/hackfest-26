import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import db from "~/db";
import {
  eventAccounts,
  eventSessions,
  eventUsers,
  eventVerificationTokens,
} from "~/db/schema/event-auth";
import { env } from "~/env";

// Separate key for eventUsers
declare module "next-auth" {
  interface Session extends DefaultSession {
    eventUser: DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "database",
  },
  basePath: "/api/auth/event",
  adapter: DrizzleAdapter(db, {
    usersTable: eventUsers,
    accountsTable: eventAccounts,
    sessionsTable: eventSessions,
    verificationTokensTable: eventVerificationTokens,
  }),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // HACK: fetch and add user data to session
    async session({ session, user }) {
      if (user) {
        session.eventUser = user;
      }
      return session;
    },
  },
});
