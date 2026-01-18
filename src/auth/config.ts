import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";
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
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile?.login && user.id) {
        const githubUsername = profile.login as string;
        try {
          const existingUser = await db
            .select()
            .from(participants)
            .where(eq(participants.id, user.id))
            .limit(1);

          if (existingUser[0] && !existingUser[0].github && githubUsername) {
            await db
              .update(participants)
              .set({ github: githubUsername as string })
              .where(eq(participants.id, user.id));
          }
        } catch {}
      }
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      const dbUser = await db
        .select()
        .from(participants)
        .where(eq(participants.id, user.id))
        .limit(1);
      const userData = dbUser[0];
      session.user.isRegistrationComplete =
        userData?.isRegistrationComplete ?? false;
      if (!userData?.github && user.id) {
        const githubAccount = await db
          .select()
          .from(accounts)
          .where(
            and(eq(accounts.userId, user.id), eq(accounts.provider, "github")),
          )
          .limit(1);

        if (githubAccount[0]?.access_token) {
          try {
            const githubResponse = await fetch("https://api.github.com/user", {
              headers: {
                Authorization: `Bearer ${githubAccount[0].access_token}`,
              },
            });
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
          } catch {}
        }
      }

      return session;
    },
  },
});
