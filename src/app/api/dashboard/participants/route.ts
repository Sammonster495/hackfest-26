import { NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import { fetchParticipants } from "~/db/services/participant-services";

export const GET = permissionProtected(
  ["team:view_all"],
  async (request: Request, _context: RouteContext) => {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Number(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || undefined;

    const filter = {
      isRegistrationComplete:
        searchParams.get("isRegistrationComplete") || undefined,
      hasTeam: searchParams.get("hasTeam") || undefined,
      gender: searchParams.get("gender") || undefined,
    };

    const result = await fetchParticipants({
      cursor,
      limit,
      search,
      filter,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  },
);
