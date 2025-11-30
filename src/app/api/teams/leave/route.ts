import { NextRequest } from "next/server";
import * as teamServices from "~/db/services/team-services";
import { successResponse } from "~/lib/response/success";
import { registrationRequiredRoute } from "~/auth/route-handlers";

export const POST = registrationRequiredRoute(
  async (_request: NextRequest, _context, user) => {
    const team = await teamServices.leaveTeam(user.id!);

    return successResponse(
      { team },
      {
        title: "Left team",
        description: "You have successfully left the team.",
      },
    );
  },
);
