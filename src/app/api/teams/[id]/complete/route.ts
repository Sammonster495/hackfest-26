import type { NextRequest } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as teamServices from "~/db/services/team-services";
import { successResponse } from "~/lib/response/success";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return registrationRequiredRoute(async (_req, ctx, user) => {
    const params = await ctx.params;
    const { id: teamId } = params;
    const team = await teamServices.completeTeam(user.id, teamId);

    return successResponse(
      { team },
      {
        title: "Team confirmed",
        description:
          "Your team has been confirmed. Members can no longer leave.",
      },
    );
  })(request, context);
}
