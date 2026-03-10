import { type NextRequest, NextResponse } from "next/server";
import z from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import { updateDashboardUserStatus } from "~/db/data/dashboard-users";

const toggleStatusSchema = z.object({
  dashboardUserId: z.string().min(1, "User ID is required"),
  isActive: z.boolean(),
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = toggleStatusSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid input",
          errors: result.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { dashboardUserId, isActive } = result.data;

    const updatedUser = await updateDashboardUserStatus(
      dashboardUserId,
      isActive,
    );
    return NextResponse.json(updatedUser, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { message: "Failed to update user status" },
      { status: 500 },
    );
  }
});
