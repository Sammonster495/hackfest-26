import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/auth/event-config";
import { publicRoute } from "~/auth/route-handlers";
import { eventHealthCheck } from "~/db/services/event-services";

export const GET = publicRoute(async (_req: NextRequest, context) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  if (!id) {
    return NextResponse.json({ message: "Invalid event id" }, { status: 400 });
  }

  return await eventHealthCheck(id);
});
