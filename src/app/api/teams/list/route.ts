import type { NextRequest } from "next/server";
import { protectedRoute } from "~/auth/route-handlers";
import * as userData from "~/db/data/participant";
import * as teamData from "~/db/data/teams";
import { successResponse } from "~/lib/response/success";

// Guess that this route is not needed

export const GET = protectedRoute(
  async (_request: NextRequest, _context, user) => {
    const dbUser = await userData.findById(user.id);
    const teams = await teamData.listTeams();

    const availableTeams = dbUser?.teamId
      ? teams.filter((team) => team.id !== dbUser.teamId && !team.isCompleted)
      : teams.filter((team) => !team.isCompleted);

    return successResponse({ teams: availableTeams });
  },
);
