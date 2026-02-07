import { NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import { fetchTeams } from "~/db/services/team-services";

export const GET = permissionProtected(
  ["team:view_all"],
  async (request: Request, _context: RouteContext) => {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Number(searchParams.get("limit")) || 50;

    const { teams, nextCursor } = await fetchTeams({ cursor, limit });

    return NextResponse.json({
      teams,
      nextCursor,
    });
  },
);
