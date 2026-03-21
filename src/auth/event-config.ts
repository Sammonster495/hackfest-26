import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import db from "~/db";
import {
  accounts,
  participants,
  sessions,
  teams,
  verificationTokens,
} from "~/db/schema";
import { env } from "~/env";
import { auth as pAuth } from "./config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-auth.session-token"
          : "auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  session: {
    strategy: "database",
  },
  basePath: "/api/auth/event",
  adapter: DrizzleAdapter(db, {
    usersTable: participants,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // lets see if we take this off later or not
    }),
  ],
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      const pSession = await pAuth();
      if (pSession?.user?.id) {
        if (user.email !== pSession.user.email)
          return "/error?error=email-mismatch";
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes("/error?error=email-mismatch"))
        return `${baseUrl}/events?error=email-mismatch`;

      return `${baseUrl}/events`;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      const dbUser = (
        await db
          .select()
          .from(participants)
          .where(eq(participants.id, user.id))
          .limit(1)
      )[0];
      session.user.isRegistrationComplete =
        dbUser?.isRegistrationComplete ?? false;
      session.user.collegeId = dbUser?.collegeId ?? null;

      const userAccounts = await db
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(eq(accounts.userId, user.id));

      session.user.isGoogle = userAccounts.some((a) => a.provider === "google");
      session.user.isGithub = userAccounts.some((a) => a.provider === "github");

      session.user.isHackathonSelected = false;
      if (dbUser?.teamId) {
        const team = (
          await db
            .select()
            .from(teams)
            .where(eq(teams.id, dbUser.teamId))
            .limit(1)
        )[0];
        if (team?.teamStage === "SELECTED") {
          session.user.isHackathonSelected = true;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/events/login",
  },
});
