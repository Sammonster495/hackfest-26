import { and, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  dashboardUsers,
  judgeCriterias,
  judgeRoundAssignments,
  judgeRounds,
  judges,
  judgeScores,
} from "~/db/schema";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const judgeRoundId = searchParams.get("judgeRoundId");
    const teamId = searchParams.get("teamId");

    if (!judgeRoundId || !teamId) {
      return NextResponse.json(
        { message: "judgeRoundId and teamId are required" },
        { status: 400 },
      );
    }

    const round = await db.query.judgeRounds.findFirst({
      where: (r, { eq }) => eq(r.id, judgeRoundId),
    });

    if (!round) {
      return NextResponse.json(
        { message: "Judge round not found" },
        { status: 404 },
      );
    }

    const assignments = await db
      .select({
        assignmentId: judgeRoundAssignments.id,
        judgeId: judges.id,
        judgeUserId: dashboardUsers.id,
        judgeName: dashboardUsers.name,
        judgeUsername: dashboardUsers.username,
      })
      .from(judgeRoundAssignments)
      .innerJoin(judges, eq(judges.id, judgeRoundAssignments.judgeId))
      .innerJoin(dashboardUsers, eq(dashboardUsers.id, judges.dashboardUserId))
      .where(
        and(
          eq(judgeRoundAssignments.judgeRoundId, judgeRoundId),
          eq(judgeRoundAssignments.teamId, teamId),
        ),
      );

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          round: {
            id: round.id,
            name: round.name,
            status: round.status,
          },
          judges: [],
        },
        { status: 200 },
      );
    }

    const criteria = await db
      .select({
        id: judgeCriterias.id,
        criteriaName: judgeCriterias.criteriaName,
        maxScore: judgeCriterias.maxScore,
      })
      .from(judgeCriterias)
      .where(eq(judgeCriterias.judgeRoundId, judgeRoundId));

    const assignmentIds = assignments.map((assignment) => assignment.assignmentId);

    const scoreRows = await db
      .select({
        assignmentId: judgeScores.roundAssignmentId,
        criteriaId: judgeScores.criteriaId,
        rawScore: judgeScores.rawScore,
      })
      .from(judgeScores)
      .where(inArray(judgeScores.roundAssignmentId, assignmentIds));

    const scoreMap = new Map<string, number>();
    for (const score of scoreRows) {
      scoreMap.set(`${score.assignmentId}:${score.criteriaId}`, score.rawScore);
    }

    const judgesWithScores = assignments.map((assignment) => {
      const criteriaScores = criteria.map((criterion) => {
        const rawScore =
          scoreMap.get(`${assignment.assignmentId}:${criterion.id}`) ?? 0;
        return {
          criteriaId: criterion.id,
          criteriaName: criterion.criteriaName,
          maxScore: criterion.maxScore,
          rawScore,
        };
      });

      const totalRawScore = criteriaScores.reduce(
        (sum, item) => sum + item.rawScore,
        0,
      );
      const totalMaxScore = criteriaScores.reduce(
        (sum, item) => sum + item.maxScore,
        0,
      );

      return {
        judgeId: assignment.judgeId,
        judgeUserId: assignment.judgeUserId,
        judgeName: assignment.judgeName,
        judgeUsername: assignment.judgeUsername,
        assignmentId: assignment.assignmentId,
        totalRawScore,
        totalMaxScore,
        criteriaScores,
      };
    });

    return NextResponse.json(
      {
        round: {
          id: round.id,
          name: round.name,
          status: round.status,
        },
        judges: judgesWithScores,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching judge score details:", error);
    return NextResponse.json(
      { message: "Failed to fetch judge score details" },
      { status: 500 },
    );
  }
});
