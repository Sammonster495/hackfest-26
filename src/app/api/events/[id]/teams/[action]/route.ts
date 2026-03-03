import type { NextRequest } from "next/server";
import { registrationOpenEventRoute } from "~/auth/route-handlers";
import {
  confirmEventTeam,
  createEventTeam,
  deleteEventTeam,
  joinEventTeam,
  kickMemberFromTeam,
  leaveEventTeam,
  teamRegistrationChecker,
} from "~/db/services/event-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";

export const POST = registrationOpenEventRoute(
  async (req: NextRequest, context, user) => {
    const { id: eventId, action } = await context.params;

    const eventUser = await teamRegistrationChecker(eventId, user.id, action);
    if (eventUser instanceof AppError) return errorResponse(eventUser);

    try {
      switch (action) {
        case "create": {
          const { teamName } = await req.json();
          return await createEventTeam(eventId, user.id, teamName);
        }
        case "leave": {
          return await leaveEventTeam(
            eventId,
            eventUser?.teamId ?? "",
            user.id,
          );
        }
        case "join": {
          const { teamId } = await req.json();
          return await joinEventTeam(
            eventId,
            user.id,
            user.collegeId ?? "",
            teamId,
          );
        }
        case "kick": {
          const { memberId } = await req.json();
          return await kickMemberFromTeam(
            eventId,
            eventUser?.teamId ?? "",
            user.id,
            memberId,
          );
        }
        case "confirm": {
          return await confirmEventTeam(
            eventId,
            eventUser?.teamId ?? "",
            user.id,
          );
        }
        default:
          return errorResponse(
            new AppError("Unknown action", 400, {
              title: "Unknown Action",
              description: "The specified action is not recognized.",
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
  },
);

export const DELETE = registrationOpenEventRoute(
  async (_req: NextRequest, context, user) => {
    const { id: eventId, action } = await context.params;

    if (action === "delete") {
      const eventUser = await teamRegistrationChecker(
        eventId,
        user.id,
        "delete",
      );
      if (eventUser instanceof AppError) return errorResponse(eventUser);

      try {
        return await deleteEventTeam(eventUser?.teamId ?? "", user.id);
      } catch (err) {
        return errorResponse(
          new AppError("Delete failed", 500, {
            title: "Delete Failed",
            description:
              err instanceof Error ? err.message : "An unknown error occurred.",
          }),
        );
      }
    }

    return errorResponse(
      new AppError("Unknown action", 400, {
        title: "Unknown Action",
        description: "The specified action is not recognized.",
      }),
    );
  },
);
