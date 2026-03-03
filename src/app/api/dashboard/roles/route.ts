import { NextResponse } from "next/server";
import { z } from "zod";
import * as rolesData from "~/db/data/roles";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  isSystemRole: z.boolean().default(false),
  isActive: z.boolean().default(true),
  permissionIds: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const roles = await rolesData.listRoles();

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await rolesData.getRolePermissions(role.id);
        return {
          ...role,
          permissions: permissions.map((p) => p.permission),
        };
      }),
    );

    return NextResponse.json(rolesWithPermissions);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = createRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const { permissionIds, ...roleData } = result.data;

    const existingRole = await rolesData.findByName(roleData.name);
    if (existingRole) {
      return NextResponse.json(
        { message: "Role with this name already exists" },
        { status: 409 },
      );
    }

    const newRole = await rolesData.createRole(roleData);

    if (permissionIds && permissionIds.length > 0) {
      await Promise.all(
        permissionIds.map((permId) =>
          rolesData.addPermissionToRole(newRole[0].id, permId),
        ),
      );
    }

    return NextResponse.json(newRole[0], { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { message: "Failed to create role" },
      { status: 500 },
    );
  }
}
