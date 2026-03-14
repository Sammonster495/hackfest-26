import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import {
  judgeCriterias,
  judgeRoundAssignments,
  judgeRounds,
  judges,
  judgeScores,
} from "~/db/schema";

const saveScoresSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  scores: z.array(
    z.object({
      criteriaId: z.string().min(1, "Criteria ID is required"),
      rawScore: z.number().int().min(0),
    }),
  ),
});

export const GET = permissionProtected(
  ["submission:score"],
  async (request, _context, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const assignmentId = searchParams.get("assignmentId");

      if (!assignmentId) {
        return NextResponse.json(
          { message: "assignmentId is required" },
          { status: 400 },
        );
      }

      const judge = await db.query.judges.findFirst({
        where: (j, { eq }) => eq(j.dashboardUserId, user.id),
      });

      if (!judge) {
        return NextResponse.json(
          { message: "Judge profile not found" },
          { status: 404 },
        );
      }

      const assignment = await db.query.judgeRoundAssignments.findFirst({
        where: (a, { and, eq }) =>
          and(eq(a.id, assignmentId), eq(a.judgeId, judge.id)),
      });

      if (!assignment) {
        return NextResponse.json(
          { message: "Assignment not found" },
          { status: 404 },
        );
      }

      const round = await db.query.judgeRounds.findFirst({
        where: (r, { eq }) => eq(r.id, assignment.judgeRoundId),
      });

      const criteria = await db
        .select({
          id: judgeCriterias.id,
          criteriaName: judgeCriterias.criteriaName,
          maxScore: judgeCriterias.maxScore,
        })
        .from(judgeCriterias)
        .where(eq(judgeCriterias.judgeRoundId, assignment.judgeRoundId));

      const existingScores = await db
        .select({
          criteriaId: judgeScores.criteriaId,
          rawScore: judgeScores.rawScore,
        })
        .from(judgeScores)
        .where(eq(judgeScores.roundAssignmentId, assignment.id));

      const scoreMap = new Map(
        existingScores.map((score) => [score.criteriaId, score.rawScore]),
      );

      return NextResponse.json(
        {
          assignmentId: assignment.id,
          roundStatus: round?.status ?? "Draft",
          criteria: criteria.map((item) => ({
            ...item,
            rawScore: scoreMap.get(item.id) ?? 0,
          })),
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error fetching judge scores:", error);
      return NextResponse.json(
        { message: "Failed to fetch judge scores" },
        { status: 500 },
      );
    }
  },
);

export const POST = permissionProtected(
  ["submission:score"],
  async (request, _context, user) => {
    try {
      const body = await request.json();
      const parsed = saveScoresSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Invalid input", errors: parsed.error.format() },
          { status: 400 },
        );
      }

      const { assignmentId, scores } = parsed.data;

      const judge = await db.query.judges.findFirst({
        where: (j, { eq }) => eq(j.dashboardUserId, user.id),
      });

      if (!judge) {
        return NextResponse.json(
          { message: "Judge profile not found" },
          { status: 404 },
        );
      }

      const assignment = await db.query.judgeRoundAssignments.findFirst({
        where: (a, { and, eq }) =>
          and(eq(a.id, assignmentId), eq(a.judgeId, judge.id)),
      });

      if (!assignment) {
        return NextResponse.json(
          { message: "Assignment not found" },
          { status: 404 },
        );
      }

      const round = await db.query.judgeRounds.findFirst({
        where: (r, { eq }) => eq(r.id, assignment.judgeRoundId),
      });

      if (round?.status === "Completed") {
        return NextResponse.json(
          { message: "Round is completed. Scoring is locked." },
          { status: 409 },
        );
      }

      const criteriaIds = scores.map((score) => score.criteriaId);

      const criteriaRows =
        criteriaIds.length === 0
          ? []
          : await db
              .select({
                id: judgeCriterias.id,
                maxScore: judgeCriterias.maxScore,
              })
              .from(judgeCriterias)
              .where(
                and(
                  eq(judgeCriterias.judgeRoundId, assignment.judgeRoundId),
                  inArray(judgeCriterias.id, criteriaIds),
                ),
              );

      const criteriaMap = new Map(
        criteriaRows.map((row) => [row.id, row.maxScore]),
      );

      for (const score of scores) {
        const maxScore = criteriaMap.get(score.criteriaId);
        if (maxScore === undefined) {
          return NextResponse.json(
            { message: "Invalid criteria for this round" },
            { status: 400 },
          );
        }

        if (score.rawScore > maxScore) {
          return NextResponse.json(
            {
              message: `Score for criteria exceeds max score (${maxScore})`,
            },
            { status: 400 },
          );
        }
      }

      for (const score of scores) {
        await db
          .insert(judgeScores)
          .values({
            roundAssignmentId: assignment.id,
            criteriaId: score.criteriaId,
            rawScore: score.rawScore,
          })
          .onConflictDoUpdate({
            target: [judgeScores.roundAssignmentId, judgeScores.criteriaId],
            set: { rawScore: score.rawScore },
          });
      }

      const updatedScores = await db
        .select({ rawScore: judgeScores.rawScore })
        .from(judgeScores)
        .where(eq(judgeScores.roundAssignmentId, assignment.id));

      const totalRawScore = updatedScores.reduce(
        (sum, item) => sum + item.rawScore,
        0,
      );

      await db
        .update(judgeRoundAssignments)
        .set({
          rawTotalScore: totalRawScore,
          normalizedTotalScore: totalRawScore,
        })
        .where(eq(judgeRoundAssignments.id, assignment.id));

      return NextResponse.json(
        { message: "Scores saved successfully", totalRawScore },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error saving judge scores:", error);
      return NextResponse.json(
        { message: "Failed to save judge scores" },
        { status: 500 },
      );
    }
  },
);
