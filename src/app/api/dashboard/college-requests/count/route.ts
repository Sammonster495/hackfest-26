import { NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import {
  getCollegeRequestCounts,
  getCollegesCount,
} from "~/db/services/college-requests";

export const GET = permissionProtected(
  ["college:view"],
  async (_request: Request, _context: RouteContext) => {
    try {
      const [counts, collegesCount] = await Promise.all([
        getCollegeRequestCounts(),
        getCollegesCount(),
      ]);
      return NextResponse.json({
        counts,
        count: counts.Pending,
        collegesCount,
      });
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
