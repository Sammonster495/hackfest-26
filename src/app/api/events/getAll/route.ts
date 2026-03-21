import type { NextRequest } from "next/server";
import { auth } from "~/auth/event-config";
import { publicRoute } from "~/auth/route-handlers";
import { getAllEvents } from "~/db/services/event-services";

export const GET = publicRoute(async (_req: NextRequest) => {
  const session = await auth();

  if (session?.user?.id) {
    return await getAllEvents(session.user.id);
  }

  return await getAllEvents();
});
