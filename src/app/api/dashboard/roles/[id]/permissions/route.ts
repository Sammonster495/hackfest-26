import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import * as rolesData from "~/db/data/roles";
import { rolePermissions } from "~/db/schema";

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
});

export const PUT = adminProtected(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id: roleId } = await context.params;
      const body = await request.json();

      const result = updatePermissionsSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { message: "Invalid input", errors: result.error.format() },
          { status: 400 },
        );
      }

      const { permissionIds } = result.data;

      const role = await rolesData.findById(roleId);
      if (!role) {
        return NextResponse.json(
          { message: "Role not found" },
          { status: 404 },
        );
      }

      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      if (permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map((permId) =>
            rolesData.addPermissionToRole(roleId, permId),
          ),
        );
      }

      return NextResponse.json({ message: "Permissions updated successfully" });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      return NextResponse.json(
        { message: "Failed to update role permissions" },
        { status: 500 },
      );
    }
  },
);
