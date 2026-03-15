import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import {
  getFeedbackCountsByAssignmentIds,
  getMentorAllocationsByMentorIds,
  getMentorRowsByDashboardUserId,
} from "~/db/services/mentor-services";

export const GET = permissionProtected(
  ["submission:remark", "submission:score"],
  async (_request, _context, user) => {
    try {
      const mentorRows = await getMentorRowsByDashboardUserId(user.id);

      const mentorIds = mentorRows.map((mentor) => mentor.id);

      if (mentorIds.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const assignments = await getMentorAllocationsByMentorIds(mentorIds);

      if (assignments.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const assignmentIds = assignments.map(
        (assignment) => assignment.assignmentId,
      );

      const feedbackStats =
        await getFeedbackCountsByAssignmentIds(assignmentIds);

      const feedbackCountMap = new Map(
        feedbackStats.map((item) => [item.assignmentId, item.feedbackCount]),
      );

      const response = assignments
        .filter((assignment) => {
          const status = assignment.roundStatus?.toLowerCase();
          return status === "active" || status === "completed";
        })
        .map((assignment) => ({
          ...assignment,
          feedbackCount: feedbackCountMap.get(assignment.assignmentId) ?? 0,
        }));

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("Error fetching mentor allocations:", error);
      return NextResponse.json(
        { message: "Failed to fetch mentor allocations" },
        { status: 500 },
      );
    }
  },
);
