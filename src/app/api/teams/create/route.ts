import type { NextRequest } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as teamServices from "~/db/services/team-services";
import { successResponse } from "~/lib/response/success";
import { parseBody } from "~/lib/validation/parse";
import { createTeamSchema } from "~/lib/validation/team";

export const POST = registrationRequiredRoute(
  async (request: NextRequest, _context, user) => {
    const body = await request.json();
    const data = parseBody(createTeamSchema, body);

    const team = await teamServices.createTeam(user.id, data.name);

    return successResponse(
      { team },
      {
        title: "Team created",
        description: `Team "${data.name}" has been created successfully.`,
      },
    );
  },
);
