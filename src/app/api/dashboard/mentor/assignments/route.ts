import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  countSelectedTeamsByIds,
  deleteAssignmentsForMentorRound,
  deleteMentorAssignmentsByIds,
  getAssignedTeamIdsForMentorRound,
  getDashboardUserById,
  getMentorAssignments,
  getMentorByDashboardUserId,
  getMentorRoundById,
  getMentorUsers,
  getOrCreateMentorByDashboardUserId,
  getRoundMentorAssignments,
  getSelectableMentorTeams,
  insertMentorAssignmentPairs,
  insertMentorAssignments,
  userHasMentorRole,
} from "~/db/services/mentor-services";

const updateAssignmentsSchema = z.object({
  mentorRoundId: z.string().min(1, "Mentor round is required"),
  mentorUserId: z.string().min(1, "Mentor user is required"),
  teamIds: z.array(z.string()).default([]),
});

const copyAssignmentsSchema = z.object({
  targetMentorRoundId: z.string().min(1, "Target mentor round is required"),
  sourceMentorRoundId: z.string().min(1, "Source mentor round is required"),
  overwriteExisting: z.boolean().default(false),
});

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const mentorRoundId = searchParams.get("mentorRoundId");
    const mentorUserId = searchParams.get("mentorUserId");
    const selectedLabId = searchParams.get("labId");

    const [mentorUsers, allTeams] = await Promise.all([
      getMentorUsers(),
      getSelectableMentorTeams(selectedLabId || null),
    ]);

    let assignedTeamIds: string[] = [];

    if (mentorRoundId && mentorUserId) {
      const mentor = await getMentorByDashboardUserId(mentorUserId);
      if (mentor) {
        assignedTeamIds = await getAssignedTeamIdsForMentorRound(
          mentorRoundId,
          mentor.id,
        );
      }
    }

    return NextResponse.json(
      {
        mentorUsers,
        teams: allTeams,
        assignedTeamIds,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching mentor assignments:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor assignments" },
      { status: 500 },
    );
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = updateAssignmentsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const { mentorRoundId, mentorUserId, teamIds } = result.data;

    if (teamIds.length > 0) {
      const uniqueTeamIdsCount = new Set(teamIds).size;
      const selectedTeamsCount = await countSelectedTeamsByIds(teamIds);

      if (selectedTeamsCount !== uniqueTeamIdsCount) {
        return NextResponse.json(
          {
            message: "Only teams in SELECTED stage can be assigned to mentors",
          },
          { status: 400 },
        );
      }
    }

    const existingRound = await getMentorRoundById(mentorRoundId);

    if (!existingRound) {
      return NextResponse.json(
        { message: "Mentor round not found" },
        { status: 404 },
      );
    }

    if (existingRound.status === "Completed") {
      return NextResponse.json(
        { message: "Round is completed and cannot be modified" },
        { status: 409 },
      );
    }

    const mentorUser = await getDashboardUserById(mentorUserId);

    if (!mentorUser) {
      return NextResponse.json(
        { message: "Mentor user not found" },
        { status: 404 },
      );
    }

    const hasMentorRole = await userHasMentorRole(mentorUserId);

    if (!hasMentorRole) {
      return NextResponse.json(
        { message: "Selected user does not have MENTOR role" },
        { status: 400 },
      );
    }

    const mentor = await getOrCreateMentorByDashboardUserId(mentorUserId);

    const existingAssignments = await getMentorAssignments(
      mentorRoundId,
      mentor.id,
    );

    const existingTeamIds = new Set(existingAssignments.map((a) => a.teamId));
    const requestedTeamIds = new Set(teamIds);

    const toRemove = existingAssignments
      .filter((assignment) => !requestedTeamIds.has(assignment.teamId))
      .map((assignment) => assignment.id);

    const toAdd = teamIds.filter((teamId) => !existingTeamIds.has(teamId));

    if (toRemove.length > 0) {
      await deleteMentorAssignmentsByIds(toRemove);
    }

    if (toAdd.length > 0) {
      await insertMentorAssignments(mentorRoundId, mentor.id, toAdd);
    }

    return NextResponse.json(
      {
        message: "Mentor assignments updated successfully",
        assignedTeamIds: teamIds,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating mentor assignments:", error);
    return NextResponse.json(
      { message: "Failed to update mentor assignments" },
      { status: 500 },
    );
  }
});

export const PATCH = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = copyAssignmentsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const { sourceMentorRoundId, targetMentorRoundId, overwriteExisting } =
      result.data;

    if (sourceMentorRoundId === targetMentorRoundId) {
      return NextResponse.json(
        { message: "Source and target rounds must be different" },
        { status: 400 },
      );
    }

    const targetRound = await getMentorRoundById(targetMentorRoundId);

    if (!targetRound) {
      return NextResponse.json(
        { message: "Target mentor round not found" },
        { status: 404 },
      );
    }

    if (targetRound.status === "Completed") {
      return NextResponse.json(
        { message: "Target round is completed and cannot be modified" },
        { status: 409 },
      );
    }

    const sourceRound = await getMentorRoundById(sourceMentorRoundId);

    if (!sourceRound) {
      return NextResponse.json(
        { message: "Source mentor round not found" },
        { status: 404 },
      );
    }

    const sourceAssignments = await getRoundMentorAssignments(
      sourceMentorRoundId,
      true,
    );

    if (sourceAssignments.length === 0) {
      return NextResponse.json(
        { message: "Source round has no mentor assignments" },
        { status: 400 },
      );
    }

    if (overwriteExisting) {
      await deleteAssignmentsForMentorRound(targetMentorRoundId);
    }

    const existingAssignments =
      await getRoundMentorAssignments(targetMentorRoundId);

    const existingSet = new Set(
      existingAssignments.map(
        (assignment) => `${assignment.mentorId}:${assignment.teamId}`,
      ),
    );

    const toInsert = sourceAssignments
      .filter(
        (assignment) =>
          !existingSet.has(`${assignment.mentorId}:${assignment.teamId}`),
      )
      .map((assignment) => ({
        mentorId: assignment.mentorId,
        teamId: assignment.teamId,
      }));

    if (toInsert.length > 0) {
      await insertMentorAssignmentPairs(targetMentorRoundId, toInsert);
    }

    return NextResponse.json(
      {
        message: "Mentor assignments copied successfully",
        copiedCount: toInsert.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error copying mentor assignments:", error);
    return NextResponse.json(
      { message: "Failed to copy mentor assignments" },
      { status: 500 },
    );
  }
});
