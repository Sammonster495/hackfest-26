import type { NextRequest } from "next/server";
import { protectedRoute } from "~/auth/route-handlers";
import {
  createEventTeam,
  deleteEventTeam,
  joinEventTeam,
  leaveEventTeam,
} from "~/db/data/event-teams";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";

export const POST = protectedRoute(async (req: NextRequest, context, user) => {
  const { id: eventId, action } = await context.params;

  try {
    switch (action) {
      case "create": {
        const { teamName } = await req.json();
        return successResponse(
          { team: await createEventTeam(eventId, user.id, teamName) },
          {
            title: "Team Created",
            description: "Your team has been created successfully.",
          },
        );
      }
      case "leave": {
        const { teamId } = await req.json();
        return successResponse(
          { team: await leaveEventTeam(eventId, user.id, teamId) },
          {
            title: "Left Team",
            description: "You have left the team successfully.",
          },
        );
      }
      case "join": {
        const { teamId } = await req.json();
        return successResponse(
          { team: await joinEventTeam(eventId, user.id, teamId) },
          {
            title: "Joined Team",
            description: "You have joined the team successfully.",
          },
        );
      }
      case "delete": {
        const { teamId } = await req.json();
        return successResponse(
          { team: await deleteEventTeam(eventId, user.id, teamId) },
          {
            title: "Team Deleted",
            description: "Your team has been deleted successfully.",
          },
        );
      }
      default:
        return errorResponse(
          new AppError("Unknown action", 400, {
            title: "Invalid Action",
            description: "The specified action is not valid.",
          }),
        );
    }
  } catch (err) {
    return errorResponse(
      new AppError("Action failed", 500, {
        title: "Action Failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
      }),
    );
  }
});
