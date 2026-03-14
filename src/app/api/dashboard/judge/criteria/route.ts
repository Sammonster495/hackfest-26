import { and, asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { judgeCriterias, judgeRounds } from "~/db/schema";

const createJudgeCriteriaSchema = z.object({
  judgeRoundId: z.string().min(1, "Judge round is required"),
  criteriaName: z.string().min(1, "Criteria name is required").max(120),
  maxScore: z.number().int().min(1).max(100),
});

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const judgeRoundId = searchParams.get("judgeRoundId");

    if (!judgeRoundId) {
      return NextResponse.json([], { status: 200 });
    }

    const criteria = await db
      .select()
      .from(judgeCriterias)
      .where(eq(judgeCriterias.judgeRoundId, judgeRoundId))
      .orderBy(asc(judgeCriterias.criteriaName));

    return NextResponse.json(criteria, { status: 200 });
  } catch (error) {
    console.error("Error fetching judge criteria:", error);
    return NextResponse.json(
      { message: "Failed to fetch judge criteria" },
      { status: 500 },
    );
  }
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = createJudgeCriteriaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const existingRound = await db.query.judgeRounds.findFirst({
      where: (round, { eq }) => eq(round.id, result.data.judgeRoundId),
    });

    if (!existingRound) {
      return NextResponse.json(
        { message: "Judge round not found" },
        { status: 404 },
      );
    }

    if (existingRound.status !== "Draft") {
      return NextResponse.json(
        {
          message:
            "Round is locked. Criteria can only be changed while status is Draft.",
        },
        { status: 409 },
      );
    }

    const duplicate = await db.query.judgeCriterias.findFirst({
      where: (criteria, { eq, and }) =>
        and(
          eq(criteria.judgeRoundId, result.data.judgeRoundId),
          eq(criteria.criteriaName, result.data.criteriaName),
        ),
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Criteria already exists for this round" },
        { status: 409 },
      );
    }

    const [created] = await db
      .insert(judgeCriterias)
      .values({
        judgeRoundId: result.data.judgeRoundId,
        criteriaName: result.data.criteriaName,
        maxScore: result.data.maxScore,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating judge criteria:", error);
    return NextResponse.json(
      { message: "Failed to create judge criteria" },
      { status: 500 },
    );
  }
});
