import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import db from "~/db";
import {
  accounts,
  participants,
  sessions,
  verificationTokens,
} from "~/db/schema";
import { env } from "~/env";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isRegistrationComplete: boolean;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: participants,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],
  events: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "github" && user.id) {
          const githubUsername = (
            await db
              .select()
              .from(participants)
              .where(eq(participants.id, user.id))
              .limit(1)
          )[0]?.github;
          if (githubUsername) return;
          if (profile?.login) {
            await db
              .update(participants)
              .set({ github: profile.login as string })
              .where(eq(participants.id, user.id));
          } else if (account.access_token) {
            try {
              const githubResponse = await fetch(
                "https://api.github.com/user",
                {
                  headers: {
                    Authorization: `Bearer ${account.access_token}`,
                  },
                },
              );
              if (githubResponse.ok) {
                const githubUser = (await githubResponse.json()) as {
                  login: string;
                };
                const githubUsername = githubUser.login;
                await db
                  .update(participants)
                  .set({ github: githubUsername })
                  .where(eq(participants.id, user.id));
              }
            } catch (error) {
              console.error(
                "Error fetching GitHub profile during sign-in:",
                error,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error during sign-in event:", error);
      }
    },
  },
  callbacks: {
    async redirect({ baseUrl }) {
      return baseUrl;
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

      return session;
    },
  },
});
