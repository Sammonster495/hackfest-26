import { NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import { fetchTeams } from "~/db/services/team-services";

export const GET = permissionProtected(
  ["team:view_all"],
  async (request: Request, _context: RouteContext) => {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Number(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || undefined;

    const filter = {
      isCompleted: searchParams.get("isCompleted") || undefined,
      paymentStatus: searchParams.get("paymentStatus") || undefined,
      attended: searchParams.get("attended") || undefined,
    };

    const { teams, nextCursor, totalCount, confirmedCount } = await fetchTeams({
      cursor,
      limit,
      search,
      filter,
    });

    return NextResponse.json({
      teams,
      nextCursor,
      totalCount,
      confirmedCount,
    });
  },
);
