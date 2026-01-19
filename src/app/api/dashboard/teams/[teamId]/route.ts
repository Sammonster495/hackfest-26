import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  permissionProtected,
  type RouteContext,
} from "~/auth/routes-wrapper";
import db from "~/db";
import * as teamData from "~/db/data/teams";
import { teams } from "~/db/schema";
import { updateTeamSchema } from "~/lib/validation/team";

type TeamIdParams = { teamId: string };

export const GET = permissionProtected<TeamIdParams>(
  ["team:view_team_details"],
  async (_request: Request, { params }: RouteContext<TeamIdParams>) => {
    const { teamId } = await params;
    const team = await teamData.findById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const members = await teamData.listMembers(teamId);

    return NextResponse.json({
      ...team,
      members,
    });
  },
);

export const PATCH = permissionProtected<TeamIdParams>(
  ["team:mark_attendance"],
  async (request: Request, { params }: RouteContext<TeamIdParams>) => {
    const { teamId } = await params;
    const body = await request.json();

    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(teams)
      .set(parsed.data)
      .where(eq(teams.id, teamId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  },
);

