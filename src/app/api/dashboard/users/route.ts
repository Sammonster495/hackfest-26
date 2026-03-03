import { NextResponse } from "next/server";
import * as dashboardUserRoleData from "~/db/data/dashboard-user-roles";
import * as dashboardUserData from "~/db/data/dashboard-users";

export async function GET() {
  try {
    const users = await dashboardUserData.listDashboardUsers();

    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const userRoles =
          await dashboardUserRoleData.findActiveRolesByDashboardUserId(user.id);
        return {
          ...user,
          passwordHash: undefined,
          roles: userRoles.map((ur) => ur.role).filter(Boolean),
        };
      }),
    );

    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard users" },
      { status: 500 },
    );
  }
}
