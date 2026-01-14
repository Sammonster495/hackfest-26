import type { NextRequest } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as teamData from "~/db/data/teams";
import * as userData from "~/db/data/users";
import { AppError } from "~/lib/errors/app-error";
import { successResponse } from "~/lib/response/success";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return registrationRequiredRoute(async (_req, ctx, user) => {
    const params = await ctx.params;
    const { id } = params;
    const team = await teamData.findById(id);

    if (!team) {
      throw new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you're looking for doesn't exist.",
      });
    }

    const dbUser = await userData.findById(user.id);
    if (!dbUser || dbUser.teamId !== team.id) {
      throw new AppError("FORBIDDEN", 403, {
        title: "Access denied",
        description: "You can only view teams you are a member of.",
      });
    }

    const members = await teamData.listMembers(id);

    return successResponse({ team, members });
  })(request, context);
}
