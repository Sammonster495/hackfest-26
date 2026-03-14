import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  judgeCriterias,
  judgeRoundAssignments,
  judgeScores,
  teams,
} from "~/db/schema";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const judgeRoundId = searchParams.get("judgeRoundId");
    const cumulative = searchParams.get("cumulative") === "true";

    if (!judgeRoundId) {
      return NextResponse.json([], { status: 200 });
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

    const criteriaTotals = await db
      .select({
        judgeRoundId: judgeCriterias.judgeRoundId,
        totalMaxScore:
          sql<number>`coalesce(sum(${judgeCriterias.maxScore}), 0)`.mapWith(
            Number,
          ),
      })
      .from(judgeCriterias)
      .groupBy(judgeCriterias.judgeRoundId);

    const maxScoreByRoundId = new Map(
      criteriaTotals.map((item) => [item.judgeRoundId, item.totalMaxScore]),
    );
    const maxPerJudge = maxScoreByRoundId.get(judgeRoundId) ?? 0;

    const assignments = await db
      .select({
        assignmentId: judgeRoundAssignments.id,
        teamId: judgeRoundAssignments.teamId,
        teamName: teams.name,
        judgeId: judgeRoundAssignments.judgeId,
        roundId: judgeRoundAssignments.judgeRoundId,
      })
      .from(judgeRoundAssignments)
      .innerJoin(teams, eq(teams.id, judgeRoundAssignments.teamId))
      .where(
        cumulative
          ? undefined
          : eq(judgeRoundAssignments.judgeRoundId, judgeRoundId),
      );

    const assignmentIds = assignments.map(
      (assignment) => assignment.assignmentId,
    );

    const scoreRows =
      assignmentIds.length === 0
        ? []
        : await db
            .select({
              assignmentId: judgeScores.roundAssignmentId,
              rawScore: judgeScores.rawScore,
            })
            .from(judgeScores)
            .where(
              sql`${judgeScores.roundAssignmentId} in (${sql.join(
                assignmentIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            );

    const scoreSumByAssignmentId = new Map<string, number>();
    const scoreEntriesByAssignmentId = new Map<string, number>();

    for (const row of scoreRows) {
      scoreSumByAssignmentId.set(
        row.assignmentId,
        (scoreSumByAssignmentId.get(row.assignmentId) ?? 0) + row.rawScore,
      );
      scoreEntriesByAssignmentId.set(
        row.assignmentId,
        (scoreEntriesByAssignmentId.get(row.assignmentId) ?? 0) + 1,
      );
    }

    const aggregateByTeamId = new Map<
      string,
      {
        teamId: string;
        teamName: string;
        totalRawScore: number;
        maxPossibleScore: number;
        judgeIds: Set<string>;
        scoreEntries: number;
      }
    >();

    for (const assignment of assignments) {
      const existing = aggregateByTeamId.get(assignment.teamId) ?? {
        teamId: assignment.teamId,
        teamName: assignment.teamName,
        totalRawScore: 0,
        maxPossibleScore: 0,
        judgeIds: new Set<string>(),
        scoreEntries: 0,
      };

      existing.totalRawScore +=
        scoreSumByAssignmentId.get(assignment.assignmentId) ?? 0;
      existing.maxPossibleScore +=
        maxScoreByRoundId.get(assignment.roundId) ?? 0;
      existing.judgeIds.add(assignment.judgeId);
      existing.scoreEntries +=
        scoreEntriesByAssignmentId.get(assignment.assignmentId) ?? 0;

      aggregateByTeamId.set(assignment.teamId, existing);
    }

    const leaderboard = Array.from(aggregateByTeamId.values())
      .map((row) => {
        const judgeCount = row.judgeIds.size;
        const percentage =
          row.maxPossibleScore > 0
            ? Number(
                ((row.totalRawScore / row.maxPossibleScore) * 100).toFixed(2),
              )
            : 0;

        return {
          teamId: row.teamId,
          teamName: row.teamName,
          totalRawScore: row.totalRawScore,
          maxPossibleScore: row.maxPossibleScore,
          percentage,
          judgeCount,
          scoreEntries: row.scoreEntries,
        };
      })
      .sort((a, b) => b.totalRawScore - a.totalRawScore)
      .map((row, index) => ({
        rank: index + 1,
        ...row,
      }));

    return NextResponse.json(
      {
        round: {
          id: round.id,
          name: round.name,
          status: round.status,
        },
        cumulative,
        maxPerJudge,
        rows: leaderboard,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching judge leaderboard:", error);
    return NextResponse.json(
      { message: "Failed to fetch judge leaderboard" },
      { status: 500 },
    );
  }
});
