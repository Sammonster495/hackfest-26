import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected } from "~/auth/routes-wrapper";
import {
  createMentorFeedback,
  deleteMentorFeedbackById,
  getAssignmentWithRoundStatus,
  getFeedbackByAssignmentId,
  isAssignmentOwnedByMentor,
  updateMentorFeedback,
} from "~/db/services/mentor-services";

const saveFeedbackSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  feedback: z.string().min(1, "Feedback is required").max(4000),
});

export const GET = permissionProtected(
  ["submission:remark", "submission:score"],
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const assignmentId = searchParams.get("assignmentId");

      if (!assignmentId) {
        return NextResponse.json(
          { message: "assignmentId is required" },
          { status: 400 },
        );
      }

      const selectedAssignment =
        await getAssignmentWithRoundStatus(assignmentId);
      if (!selectedAssignment) {
        return NextResponse.json(
          { message: "Mentor assignment not found" },
          { status: 404 },
        );
      }

      const existingFeedback = await getFeedbackByAssignmentId(assignmentId);

      const primaryFeedback = existingFeedback[0];

      return NextResponse.json(
        {
          assignmentId: selectedAssignment.assignmentId,
          roundStatus: selectedAssignment.roundStatus,
          feedback: primaryFeedback?.feedback ?? "",
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error fetching mentor feedback:", error);
      return NextResponse.json(
        { message: "Failed to fetch mentor feedback" },
        { status: 500 },
      );
    }
  },
);

export const POST = permissionProtected(
  ["submission:remark", "submission:score"],
  async (req: NextRequest, _context, user) => {
    try {
      const body = await req.json();
      const parsed = saveFeedbackSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Invalid input", errors: parsed.error.format() },
          { status: 400 },
        );
      }

      const { assignmentId, feedback } = parsed.data;

      const selectedAssignment =
        await getAssignmentWithRoundStatus(assignmentId);
      if (!selectedAssignment) {
        return NextResponse.json(
          { message: "Mentor assignment not found" },
          { status: 404 },
        );
      }

      if (selectedAssignment.roundStatus === "Completed") {
        return NextResponse.json(
          { message: "Round is completed. Feedback is locked." },
          { status: 409 },
        );
      }

      const isOwnedByMentor = await isAssignmentOwnedByMentor(
        assignmentId,
        user.id,
      );

      if (!isOwnedByMentor) {
        return NextResponse.json(
          { message: "Only assigned mentor can submit feedback" },
          { status: 403 },
        );
      }

      const existingFeedback = await getFeedbackByAssignmentId(assignmentId);

      if (existingFeedback.length === 0) {
        await createMentorFeedback(assignmentId, feedback);
      } else {
        const [primary, ...duplicates] = existingFeedback;

        await updateMentorFeedback(primary.id, feedback);

        if (duplicates.length > 0) {
          await Promise.all(
            duplicates.map((entry) => deleteMentorFeedbackById(entry.id)),
          );
        }
      }

      return NextResponse.json(
        { message: "Feedback saved successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error saving mentor feedback:", error);
      return NextResponse.json(
        { message: "Failed to save mentor feedback" },
        { status: 500 },
      );
    }
  },
);
