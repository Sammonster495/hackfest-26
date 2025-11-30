import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth, { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import db from "~/db";
import { users, accounts, sessions, verificationTokens } from "~/db/schema";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "Admin" | "User" | "Participant" | "Judge";
      isRegistrationComplete: boolean;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      const dbUser = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      const userData = dbUser[0];
      session.user.role = userData?.role ?? "User";
      session.user.isRegistrationComplete =
        userData?.isRegistrationComplete ?? false;
      return session;
    },
  },
});
