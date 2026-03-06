import type { NextRequest } from "next/server";
import { registrationOpenEventRoute } from "~/auth/route-handlers";
import {
  cancelSoloEvent,
  registerSoloEvent,
  soloRegistrationChecker,
} from "~/db/services/event-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";

export const POST = registrationOpenEventRoute(
  async (_req: NextRequest, context, user) => {
    const { id: eventId, action } = await context.params;

    const eventUser = await soloRegistrationChecker(eventId, user.id, action);
    if (eventUser instanceof AppError) return errorResponse(eventUser);

    try {
      switch (action) {
        case "register":
          return await registerSoloEvent(eventId, user.id, user.name ?? "");
        case "cancel":
          return await cancelSoloEvent(eventUser?.teamId ?? "");
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
