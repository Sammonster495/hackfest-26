import { getAllEvents } from "~/db/data/events";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";

export async function GET() {
  const events = await getAllEvents();

  if (events.length === 0)
    return errorResponse(
      new AppError("Events not found", 404, {
        toast: false,
        title: "Fetch Failed",
      }),
    );

  return successResponse({ events: events }, { toast: false });
}
