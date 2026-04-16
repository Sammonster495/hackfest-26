import { NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import { fetchAttendanceTeams } from "~/db/services/team-services";
import { successResponse } from "~/lib/response/success";

export const GET = permissionProtected(
  ["attendance:mark"],
  async (request: Request, _context: RouteContext) => {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const filter = {
      paymentStatus: searchParams.get("paymentStatus") || undefined,
      attended: searchParams.get("attended") || undefined,
    };

    const { teams, stats } = await fetchAttendanceTeams({
      search,
      filter,
    });

    console.log("Fetched teams for attendance with params:", {
      search,
      filter,
      teamCount: teams.length,
    });

    return successResponse({ teams, stats });
  },
);
