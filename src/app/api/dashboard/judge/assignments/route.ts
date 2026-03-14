import { and, asc, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUserRoles,
  dashboardUsers,
  judgeRoundAssignments,
  judgeRounds,
  judges,
  roles,
  teams,
} from "~/db/schema";

const updateAssignmentsSchema = z.object({
  judgeRoundId: z.string().min(1, "Judge round is required"),
  judgeUserId: z.string().min(1, "Judge user is required"),
  teamIds: z.array(z.string()).default([]),
});

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const judgeRoundId = searchParams.get("judgeRoundId");
    const judgeUserId = searchParams.get("judgeUserId");

    const judgeUsers = await db
      .select({
        id: dashboardUsers.id,
        name: dashboardUsers.name,
        username: dashboardUsers.username,
      })
      .from(dashboardUsers)
      .innerJoin(
        dashboardUserRoles,
        and(
          eq(dashboardUserRoles.dashboardUserId, dashboardUsers.id),
          eq(dashboardUserRoles.isActive, true),
        ),
      )
      .innerJoin(roles, eq(roles.id, dashboardUserRoles.roleId))
      .where(inArray(roles.name, ["JUDGE", "FINAL_JUDGE"]))
      .orderBy(asc(dashboardUsers.name));

    const uniqueJudgeUsers = Array.from(
      new Map(judgeUsers.map((user) => [user.id, user])).values(),
    );

    const allTeams = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .orderBy(asc(teams.name));

    let assignedTeamIds: string[] = [];

    if (judgeRoundId && judgeUserId) {
      const judge = await db.query.judges.findFirst({
        where: (j, { eq }) => eq(j.dashboardUserId, judgeUserId),
      });

      if (judge) {
        const assignments = await db
          .select({ teamId: judgeRoundAssignments.teamId })
          .from(judgeRoundAssignments)
          .where(
            and(
              eq(judgeRoundAssignments.judgeRoundId, judgeRoundId),
              eq(judgeRoundAssignments.judgeId, judge.id),
            ),
          );

        assignedTeamIds = assignments.map((assignment) => assignment.teamId);
      }
    }

    return NextResponse.json(
      {
        judgeUsers: uniqueJudgeUsers,
        teams: allTeams,
        assignedTeamIds,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching judge assignments:", error);
    return NextResponse.json(
      { message: "Failed to fetch judge assignments" },
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

    const { judgeRoundId, judgeUserId, teamIds } = result.data;

    const existingRound = await db.query.judgeRounds.findFirst({
      where: (round, { eq }) => eq(round.id, judgeRoundId),
    });

    if (!existingRound) {
      return NextResponse.json(
        { message: "Judge round not found" },
        { status: 404 },
      );
    }

    if (existingRound.status === "Completed") {
      return NextResponse.json(
        { message: "Round is completed and cannot be modified" },
        { status: 409 },
      );
    }

    const judgeUser = await db.query.dashboardUsers.findFirst({
      where: (u, { eq }) => eq(u.id, judgeUserId),
    });

    if (!judgeUser) {
      return NextResponse.json(
        { message: "Judge user not found" },
        { status: 404 },
      );
    }

    let judge = await db.query.judges.findFirst({
      where: (j, { eq }) => eq(j.dashboardUserId, judgeUserId),
    });

    if (!judge) {
      const [createdJudge] = await db
        .insert(judges)
        .values({ dashboardUserId: judgeUserId })
        .returning();
      judge = createdJudge;
    }

    const existingAssignments = await db
      .select({ id: judgeRoundAssignments.id, teamId: judgeRoundAssignments.teamId })
      .from(judgeRoundAssignments)
      .where(
        and(
          eq(judgeRoundAssignments.judgeRoundId, judgeRoundId),
          eq(judgeRoundAssignments.judgeId, judge.id),
        ),
      );

    const existingTeamIds = new Set(existingAssignments.map((a) => a.teamId));
    const requestedTeamIds = new Set(teamIds);

    const toRemove = existingAssignments
      .filter((assignment) => !requestedTeamIds.has(assignment.teamId))
      .map((assignment) => assignment.id);

    const toAdd = teamIds.filter((teamId) => !existingTeamIds.has(teamId));

    if (toRemove.length > 0) {
      await db
        .delete(judgeRoundAssignments)
        .where(inArray(judgeRoundAssignments.id, toRemove));
    }

    if (toAdd.length > 0) {
      await db.insert(judgeRoundAssignments).values(
        toAdd.map((teamId) => ({
          judgeId: judge.id,
          teamId,
          judgeRoundId,
        })),
      );
    }

    return NextResponse.json(
      {
        message: "Assignments updated successfully",
        assignedTeamIds: teamIds,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating judge assignments:", error);
    return NextResponse.json(
      { message: "Failed to update judge assignments" },
      { status: 500 },
    );
  }
});
