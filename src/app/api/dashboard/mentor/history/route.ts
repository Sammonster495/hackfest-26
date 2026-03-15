import { type NextRequest, NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import { getMentorFeedbackHistory } from "~/db/services/mentor-services";
import { isAdmin } from "~/lib/auth/permissions";

export const GET = permissionProtected(
  ["submission:remark", "submission:score"],
  async (req: NextRequest, _context, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const teamId = searchParams.get("teamId");
      const mentorRoundId = searchParams.get("mentorRoundId");

      const rows = await getMentorFeedbackHistory({
        teamId,
        mentorRoundId,
        dashboardUserId: isAdmin(user) ? undefined : user.id,
      });

      return NextResponse.json(rows, { status: 200 });
    } catch (error) {
      console.error("Error fetching mentor feedback history:", error);
      return NextResponse.json(
        { message: "Failed to fetch mentor feedback history" },
        { status: 500 },
      );
    }
  },
);
