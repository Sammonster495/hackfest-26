import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  ideaSubmission,
  judgeCriterias,
  judgeRoundAssignments,
  judgeRounds,
  judgeScores,
  teams,
  tracks,
} from "~/db/schema";

export const GET = permissionProtected(
  ["submission:score"],
  async (_request, _context, user) => {
    try {
      const judge = await db.query.judges.findFirst({
        where: (j, { eq }) => eq(j.dashboardUserId, user.id),
      });

      if (!judge) {
        return NextResponse.json([], { status: 200 });
      }

      const assignments = await db
        .select({
          assignmentId: judgeRoundAssignments.id,
          teamId: teams.id,
          teamName: teams.name,
          teamStage: teams.teamStage,
          paymentStatus: teams.paymentStatus,
          roundId: judgeRounds.id,
          roundName: judgeRounds.name,
          roundStatus: judgeRounds.status,
          pptUrl: ideaSubmission.pptUrl,
          trackName: tracks.name,
        })
        .from(judgeRoundAssignments)
        .innerJoin(teams, eq(teams.id, judgeRoundAssignments.teamId))
        .innerJoin(
          judgeRounds,
          eq(judgeRounds.id, judgeRoundAssignments.judgeRoundId),
        )
        .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
        .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
        .where(eq(judgeRoundAssignments.judgeId, judge.id));

      if (assignments.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const roundIds = Array.from(new Set(assignments.map((a) => a.roundId)));
      const assignmentIds = assignments.map((a) => a.assignmentId);

      const criteriaStats = await db
        .select({
          roundId: judgeCriterias.judgeRoundId,
          totalCriteria: sql<number>`count(*)`.mapWith(Number),
          totalMaxScore:
            sql<number>`coalesce(sum(${judgeCriterias.maxScore}), 0)`.mapWith(
              Number,
            ),
        })
        .from(judgeCriterias)
        .where(inArray(judgeCriterias.judgeRoundId, roundIds))
        .groupBy(judgeCriterias.judgeRoundId);

      const scoreStats = await db
        .select({
          assignmentId: judgeScores.roundAssignmentId,
          scoredCriteria: sql<number>`count(*)`.mapWith(Number),
          totalRawScore:
            sql<number>`coalesce(sum(${judgeScores.rawScore}), 0)`.mapWith(
              Number,
            ),
        })
        .from(judgeScores)
        .where(inArray(judgeScores.roundAssignmentId, assignmentIds))
        .groupBy(judgeScores.roundAssignmentId);

      const criteriaMap = new Map(
        criteriaStats.map((item) => [item.roundId, item]),
      );
      const scoreMap = new Map(
        scoreStats.map((item) => [item.assignmentId, item]),
      );

      const response = assignments.map((assignment) => {
        const criteria =
          criteriaMap.get(assignment.roundId) ??
          ({ totalCriteria: 0, totalMaxScore: 0 } as const);
        const score =
          scoreMap.get(assignment.assignmentId) ??
          ({ scoredCriteria: 0, totalRawScore: 0 } as const);

        return {
          ...assignment,
          scoredCriteria: score.scoredCriteria,
          totalCriteria: criteria.totalCriteria,
          totalRawScore: score.totalRawScore,
          totalMaxScore: criteria.totalMaxScore,
        };
      });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("Error fetching judge allocations:", error);
      return NextResponse.json(
        { message: "Failed to fetch judge allocations" },
        { status: 500 },
      );
    }
  },
);
