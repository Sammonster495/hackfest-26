import type { NextRequest } from "next/server";
import { z } from "zod";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as teamServices from "~/db/services/team-services";
import { successResponse } from "~/lib/response/success";
import { parseBody } from "~/lib/validation/parse";

const joinTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

export const POST = registrationRequiredRoute(
  async (request: NextRequest, _context, user) => {
    const body = await request.json();
    const data = parseBody(joinTeamSchema, body);

    const team = await teamServices.joinTeam(user.id, data.teamId);

    return successResponse(
      { team },
      {
        title: "Joined team",
        description: "You have successfully joined the team.",
      },
    );
  },
);
