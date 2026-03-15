import { NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected, permissionProtected } from "~/auth/routes-wrapper";
import {
  listLeaderboard,
  moveLeaderboardTeamsToRound2,
} from "~/db/services/submission-services";
import { errorResponse } from "~/lib/response/error";

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  trackId: z.string().optional(),
  search: z.string().optional(),
  round: z.enum(["ROUND_1", "ROUND_2", "all"]).optional(),
  scoreType: z.enum(["average", "sum", "normalized"]).default("average"),
});

const moveTeamsSchema = z.object({
  teamIds: z.array(z.string().min(1)).min(1),
});

export const GET = permissionProtected(
  ["submission:view", "submission:score"],
  async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const parsed = querySchema.parse({
        cursor: searchParams.get("cursor") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        trackId: searchParams.get("trackId") ?? undefined,
        search: searchParams.get("search") ?? undefined,
        round: searchParams.get("round") ?? undefined,
        scoreType: searchParams.get("scoreType") ?? undefined,
      });

      const result = await listLeaderboard(parsed);
      return NextResponse.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  },
);

export const POST = adminProtected(async (request) => {
  try {
    const body = await request.json();
    const parsed = moveTeamsSchema.parse(body);
    const result = await moveLeaderboardTeamsToRound2(parsed.teamIds);

    return NextResponse.json({
      message: "Teams moved to Round 2",
      movedCount: result.movedCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
