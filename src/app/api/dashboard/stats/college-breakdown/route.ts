import { type NextRequest, NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import {
  getCollegeBreakdown,
  getCollegeBreakdownStates,
} from "~/db/services/dashboard-stats";

export const GET = permissionProtected(
  ["dashboard:access"],
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") ?? "0", 10);
      const limit = parseInt(searchParams.get("limit") ?? "10", 10);
      const state = searchParams.get("state") ?? undefined;
      const ideaOnly = searchParams.get("ideaOnly") === "true";

      const [{ data, total }, states] = await Promise.all([
        getCollegeBreakdown({ page, limit, state, ideaOnly }),
        getCollegeBreakdownStates(),
      ]);

      return NextResponse.json(
        { data, total, states },
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          },
        },
      );
    } catch (error) {
      console.error("Failed to fetch college breakdown:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  },
);
