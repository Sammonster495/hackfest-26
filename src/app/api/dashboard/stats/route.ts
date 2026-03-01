import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import {
  getCollegeRankingsBySelections,
  getDashboardStats,
  getStatesStats,
} from "~/db/services/dashboard-stats";

export const GET = permissionProtected(["dashboard:access"], async () => {
  try {
    const [quickStats, statesStats, collegeRankings] = await Promise.all([
      getDashboardStats(),
      getStatesStats(),
      getCollegeRankingsBySelections(),
    ]);

    return NextResponse.json(
      {
        quickStats,
        statesStats,
        collegeRankings,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
});
