import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import * as dashboardUserRoleData from "~/db/data/dashboard-user-roles";

const assignRoleSchema = z.object({
  dashboardUserId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = assignRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const { dashboardUserId, roleId } = result.data;

    const activeRoles =
      await dashboardUserRoleData.findActiveRolesByDashboardUserId(
        dashboardUserId,
      );
    const hasRole = activeRoles.some((ar) => ar.roleId === roleId);

    if (hasRole) {
      return NextResponse.json(
        { message: "User already has this role" },
        { status: 400 },
      );
    }

    const assigned = await dashboardUserRoleData.assignRole({
      dashboardUserId,
      roleId,
      isActive: true,
    });

    return NextResponse.json(assigned, { status: 201 });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { message: "Failed to assign role" },
      { status: 500 },
    );
  }
});

export const DELETE = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const dashboardUserId = searchParams.get("userId");
    const roleId = searchParams.get("roleId");

    if (!dashboardUserId || !roleId) {
      return NextResponse.json(
        { message: "userId and roleId are required" },
        { status: 400 },
      );
    }

    const activeRoles =
      await dashboardUserRoleData.findActiveRolesByDashboardUserId(
        dashboardUserId,
      );
    const roleLink = activeRoles.find((ar) => ar.roleId === roleId);

    if (!roleLink) {
      return NextResponse.json(
        { message: "User does not have this active role" },
        { status: 404 },
      );
    }

    await dashboardUserRoleData.revokeRole(roleLink.id);

    return NextResponse.json(
      { message: "Role removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error removing role:", error);
    return NextResponse.json(
      { message: "Failed to remove role" },
      { status: 500 },
    );
  }
});
