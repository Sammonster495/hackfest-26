import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import type { RouteContext } from "~/auth/routes-wrapper";
import {
  assignTeamToLab,
  autoAssignLabs,
  deleteLab,
  getLabTeams,
  unassignTeamFromLab,
} from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(
  async (_req: NextRequest, context: RouteContext<{ id: string }>) => {
    try {
      const { id } = await context.params;
      if (id === "auto-assign") {
        const result = await autoAssignLabs();
        return NextResponse.json(result);
      }
      const teams = await getLabTeams(id);
      return NextResponse.json({ teams });
    } catch (error) {
      return errorResponse(error);
    }
  },
);

export const DELETE = adminProtected(
  async (_req: NextRequest, context: RouteContext<{ id: string }>) => {
    try {
      const { id } = await context.params;
      const deleted = await deleteLab(id);
      if (!deleted) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
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
      const { teamId, action } = await req.json();

      if (!teamId || !action) {
        return NextResponse.json({ error: "teamId and action required" }, { status: 400 });
      }

      if (action === "assign") {
        await assignTeamToLab(teamId, id);
        return NextResponse.json({ ok: true });
      }
      if (action === "unassign") {
        await unassignTeamFromLab(teamId);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      if (error instanceof Error && error.message.includes("full capacity")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return errorResponse(error);
    }
  },
);
