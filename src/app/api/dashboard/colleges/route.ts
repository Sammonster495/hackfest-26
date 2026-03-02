import { NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import { fetchCollegesPaginated } from "~/db/services/college-requests";

export const GET = permissionProtected(
  ["college:view"], // Or a more specific permission if available
  async (request: Request, _context: RouteContext) => {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Number(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || undefined;

    const { colleges, nextCursor, totalCount } = await fetchCollegesPaginated({
      cursor,
      limit,
      search,
    });

    return NextResponse.json({
      colleges,
      nextCursor,
      totalCount,
    });
  },
);
