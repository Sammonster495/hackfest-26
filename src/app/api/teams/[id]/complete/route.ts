import { NextRequest } from "next/server";
import * as teamServices from "~/db/services/team-services";
import { successResponse } from "~/lib/response/success";
import { registrationRequiredRoute } from "~/auth/route-handlers";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return registrationRequiredRoute(async (_req, ctx, user) => {
    const { id: teamId } = await ctx.params!;
    const team = await teamServices.completeTeam(user.id!, teamId);

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
