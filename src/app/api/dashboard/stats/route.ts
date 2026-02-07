import { NextResponse } from "next/server";
import { auth } from "~/auth/dashboard-config";
import {
  getCollegeRankingsBySelections,
  getDashboardStats,
  getStatesStats,
} from "~/db/services/dashboard-stats";
import { hasPermission, isAdmin } from "~/lib/auth/check-access";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.dashboardUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dashboardUser = session.dashboardUser;
    const hasAccess =
      isAdmin(dashboardUser) ||
      hasPermission(dashboardUser, "dashboard:access");

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const [quickStats, statesStats, collegeRankings] = await Promise.all([
      getDashboardStats(),
      getStatesStats(),
      getCollegeRankingsBySelections(),
    ]);

    return NextResponse.json({
      quickStats,
      statesStats,
      collegeRankings,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
