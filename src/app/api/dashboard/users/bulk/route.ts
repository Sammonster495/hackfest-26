import { NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import * as dashboardUserRoleData from "~/db/data/dashboard-user-roles";
import * as dashboardUserData from "~/db/data/dashboard-users";
import { hashPassword } from "~/lib/auth/password";

const bulkUserSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
  users: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        username: z.string().min(1, "Username is required"),
        email: z.string().email().optional().or(z.literal("")),
        password: z.string().min(1, "Password is required"),
      }),
    )
    .min(1, "At least one user is required"),
});

export const POST = adminProtected(async (req) => {
  try {
    const body = await req.json();
    const result = bulkUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.issues },
        { status: 400 },
      );
    }

    const { roleId, users } = result.data;

    let successCount = 0;
    const errors = [];

    for (const [index, userConfig] of users.entries()) {
      try {
        const passwordHash = await hashPassword(userConfig.password);

        const existingUser = await dashboardUserData.findByUsernameOrEmail(
          userConfig.username,
        );
        if (existingUser) {
          errors.push(
            `Row ${index + 1}: Username '${userConfig.username}' already exists.`,
          );
          continue;
        }

        const newUserPayload = {
          name: userConfig.name,
          username: userConfig.username,
          email: userConfig.email || null,
          passwordHash,
          isActive: true,
        };

        const createdUsers =
          await dashboardUserData.createDashboardUser(newUserPayload);

        let createdUserId = "";
        if (Array.isArray(createdUsers) && createdUsers.length > 0) {
          createdUserId = createdUsers[0].id;
        } else if (
          createdUsers &&
          typeof createdUsers === "object" &&
          "id" in createdUsers
        ) {
          createdUserId = (createdUsers as { id: string }).id;
        }

        if (!createdUserId) {
          const fetchedUser = await dashboardUserData.findByUsernameOrEmail(
            userConfig.username,
          );
          if (fetchedUser) createdUserId = fetchedUser.id;
        }

        if (createdUserId) {
          await dashboardUserRoleData.assignRole({
            dashboardUserId: createdUserId,
            roleId,
          });
          successCount++;
        } else {
          errors.push(
            `Row ${index + 1}: Could not verify creation for '${userConfig.username}'.`,
          );
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create user";
        errors.push(`Row ${index + 1}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      successCount,
      errors,
      message: `Successfully created ${successCount} user(s).${errors.length > 0 ? " Some errors occurred." : ""}`,
    });
  } catch (error) {
    console.error("Error bulk creating users:", error);
    return NextResponse.json(
      { error: "Failed to process bulk user creation" },
      { status: 500 },
    );
  }
});
