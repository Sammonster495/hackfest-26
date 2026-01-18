import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "~/db";
import * as teamData from "~/db/data/teams";
import { teams } from "~/db/schema";
import { hasPermission, requireAdmin } from "~/lib/auth/check-access";
import { updateTeamSchema } from "~/lib/validation/team";

type RouteParams = {
    params: Promise<{ teamId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
    const hasAccess = await hasPermission("team:view_team_details");
    if (!hasAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json();

    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid data", details: parsed.error.flatten() },
            { status: 400 }
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
}
