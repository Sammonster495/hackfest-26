import { auth } from "~/auth/event-config";
import { getAllEvents } from "~/db/data/events";

export async function GET() {
  const session = await auth();

  if (session?.eventUser) return await getAllEvents(session.eventUser.id);

  return await getAllEvents();
}
