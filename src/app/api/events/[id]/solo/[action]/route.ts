import type { NextRequest } from "next/server";
import { protectedEventRoute } from "~/auth/route-handlers";
import { createEventTeam, deleteEventTeam } from "~/db/data/event-teams";
import { findByEvent } from "~/db/data/event-users";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";

export const POST = protectedEventRoute(
  async (_req: NextRequest, context, user) => {
    const { id: eventId, action } = await context.params;
    const eventUser = await findByEvent(eventId, user.id);

    try {
      switch (action) {
        case "register": {
          if (eventUser) {
            return errorResponse(
              new AppError("Already registered", 400, {
                title: "Registration Failed",
                description: "You are already registered for this event.",
              }),
            );
          }

          return await createEventTeam(eventId, user.id, user.name ?? "", true);
        }
        case "unregister": {
          if (!eventUser) {
            return errorResponse(
              new AppError("Not registered", 400, {
                title: "Unregistration Failed",
                description: "You are not registered for this event.",
              }),
            );
          }

          return await deleteEventTeam(eventUser.teamId);
        }
        default:
          return errorResponse(
            new AppError("Invalid action", 400, {
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
  },
);
