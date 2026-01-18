import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as dashboardUserRoleData from "~/db/data/dashboard-user-roles";
import * as dashboardUserData from "~/db/data/dashboard-users";
import { verifyPassword } from "~/lib/auth/password";

// Type structure matching the query result from findActiveRolesByDashboardUserId
// The wrapper loses type information, so we define it manually based on the query structure
type DashboardUserRoleWithRelations = {
  id: string;
  isActive: boolean;
  dashboardUserId: string;
  roleId: string;
  assignedAt: Date;
  role: {
    id: string;
    name: string;
    description: string | null;
    isSystemRole: boolean;
    isActive: boolean;
    permissions: Array<{
      roleId: string;
      permissionId: string;
      permission: {
        id: string;
        key: string;
        description: string | null;
      };
    }>;
  } | null;
};

type RoleWithPermissions = NonNullable<DashboardUserRoleWithRelations["role"]>;
type RolePermission = NonNullable<RoleWithPermissions["permissions"]>[number];

declare module "next-auth" {
  interface Session extends DefaultSession {
    dashboardUser: {
      id: string;
      username: string;
      name: string;
      roles: Array<{
        id: string;
        name: string;
        permissions: Array<{
          id: string;
          key: string;
        }>;
      }>;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/api/auth/dashboard",
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await dashboardUserData.findByUsername(
          credentials.username as string,
        );

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash,
        );

        if (!isValid) {
          return null;
        }

        await dashboardUserData.updateLastLogin(user.id);

        return {
          id: user.id,
          name: user.name,
          email: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id;
      if (userId) {
        token.id = userId;
        const dbUser = await dashboardUserData.findById(userId);

        if (dbUser) {
          const userRoles =
            (await dashboardUserRoleData.findActiveRolesByDashboardUserId(
              userId,
            )) as DashboardUserRoleWithRelations[];

          token.dashboardUser = {
            id: userId,
            username: dbUser.username,
            name: dbUser.name,
            roles: userRoles.map((ur) => {
              const role = ur.role;
              return {
                id: role?.id ?? "",
                name: role?.name ?? "",
                permissions:
                  role?.permissions?.map((rp: RolePermission) => ({
                    id: rp.permission?.id ?? "",
                    key: rp.permission?.key ?? "",
                  })) ?? [],
              };
            }),
          };
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.dashboardUser && typeof token.dashboardUser === "object") {
        const dashboardUser = token.dashboardUser as {
          id: string;
          username: string;
          name: string;
          roles: Array<{
            id: string;
            name: string;
            permissions: Array<{
              id: string;
              key: string;
            }>;
          }>;
        };
        session.dashboardUser = dashboardUser;
      }
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/dashboard/login",
  },
});
