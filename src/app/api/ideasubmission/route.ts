import { type NextRequest, NextResponse } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import { permissionProtected } from "~/auth/routes-wrapper";
import { fetchIdeas, submitIdea } from "~/db/services/idea-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";

export const POST = registrationRequiredRoute(
  async (req: NextRequest, _ctx, user) => {
    const { teamId, pdfUrl, trackId } = await req.json();
    try {
      const result = await submitIdea({
        teamId,
        pdfUrl,
        trackId,
        userId: user.id,
      });
      return successResponse({ result });
    } catch (e) {
      if (e instanceof AppError) {
        return errorResponse(e);
      }
      return errorResponse(
        new AppError("INTERNAL_ERROR", 500, {
          title: "Internal server error",
          description: "Failed to submit idea. Please try again later.",
        }),
      );
    }
  },
);

export const GET = permissionProtected(
  ["submission:view"],
  async (req: NextRequest, _ctx, user) => {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Number(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || undefined;
    const trackId = searchParams.get("trackId") || "all";

    const { ideas, nextCursor, totalCount } = await fetchIdeas({
      cursor,
      limit,
      search,
      trackId: trackId === "all" ? undefined : trackId,
    });

    return NextResponse.json({
      ideas,
      nextCursor,
      totalCount,
    });
  },
);
