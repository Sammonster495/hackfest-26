import { NextRequest } from "next/server";
import * as teamServices from "~/db/services/team-services";
import { parseBody } from "~/lib/validation/parse";
import { createTeamSchema } from "~/lib/validation/team";
import { successResponse } from "~/lib/response/success";
import { registrationRequiredRoute } from "~/auth/route-handlers";

export const POST = registrationRequiredRoute(
  async (request: NextRequest, _context, user) => {
    const body = await request.json();
    const data = parseBody(createTeamSchema, body);

    const team = await teamServices.createTeam(user.id!, data.name);

    return successResponse(
      { team },
      {
        title: "Team created",
        description: `Team "${data.name}" has been created successfully.`,
      },
    );
  },
);
