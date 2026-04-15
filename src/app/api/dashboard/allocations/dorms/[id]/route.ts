import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import type { RouteContext } from "~/auth/routes-wrapper";
import {
  assignTeamMembersByGenderToDorm,
  assignTeamToDorm,
  deleteDorm,
  getDormTeams,
  unassignTeamFromDorm,
  unassignTeamMembersByGender,
} from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(
  async (_req: NextRequest, context: RouteContext<{ id: string }>) => {
    try {
      const { id } = await context.params;
      const dormTeams = await getDormTeams(id);
      return NextResponse.json({ teams: dormTeams });
    } catch (error) {
      return errorResponse(error);
    }
  },
);

export const DELETE = adminProtected(
  async (_req: NextRequest, context: RouteContext<{ id: string }>) => {
    try {
      const { id } = await context.params;
      const deleted = await deleteDorm(id);
      if (!deleted) {
        return NextResponse.json({ error: "Dorm not found" }, { status: 404 });
      }
      return NextResponse.json({ deleted });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Cannot delete")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return errorResponse(error);
    }
  },
);

export const PATCH = adminProtected(
  async (req: NextRequest, context: RouteContext<{ id: string }>) => {
    try {
      const { id } = await context.params;
      const { teamId, action, gender } = await req.json();

      if (!teamId || !action) {
        return NextResponse.json(
          { error: "teamId and action required" },
          { status: 400 },
        );
      }

      if (action === "assign") {
        if (gender) {
          await assignTeamMembersByGenderToDorm(teamId, gender, id);
        } else {
          await assignTeamToDorm(teamId, id);
        }
        return NextResponse.json({ ok: true });
      }
      if (action === "unassign") {
        if (gender) {
          await unassignTeamMembersByGender(teamId, gender);
        } else {
          await unassignTeamFromDorm(teamId);
        }
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
