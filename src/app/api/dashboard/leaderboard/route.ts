import { NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import { promoteLeaderboardTeams } from "~/db/services/submission-services";
import { errorResponse } from "~/lib/response/error";

const moveTeamsSchema = z.object({
  teamIds: z.array(z.string().min(1)).min(1),
  currentStage: z.enum(["NOT_SELECTED", "SEMI_SELECTED", "SELECTED"]),
  nextStage: z.enum(["NOT_SELECTED", "SEMI_SELECTED", "SELECTED"]),
});

export const POST = adminProtected(async (request, _ctx, user) => {
  try {
    const body = await request.json();
    const parsed = moveTeamsSchema.parse(body);
    const result = await promoteLeaderboardTeams(
      parsed.teamIds,
      parsed.currentStage,
      parsed.nextStage,
      user,
    );

    return NextResponse.json({
      message: `Teams moved to ${parsed.nextStage}`,
      movedCount: result.movedCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
