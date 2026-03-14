import { NextResponse } from "next/server";
import { z } from "zod";
import { permissionProtected } from "~/auth/routes-wrapper";
import { submitEvaluationScore } from "~/db/services/evaluation-services";
import { errorResponse } from "~/lib/response/error";

const submitSchema = z.object({
  teamId: z.string().min(1),
  score: z.coerce.number().int().min(0).max(10),
  round: z.enum(["ROUND_1", "ROUND_2"]),
});

export const POST = permissionProtected(
  ["submission:score"],
  async (request, _context, user) => {
    try {
      const body = await request.json();
      const parsed = submitSchema.parse(body);

      const result = await submitEvaluationScore({
        evaluatorId: user.id,
        teamId: parsed.teamId,
        score: parsed.score,
        round: parsed.round,
      });

      return NextResponse.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  },
);
