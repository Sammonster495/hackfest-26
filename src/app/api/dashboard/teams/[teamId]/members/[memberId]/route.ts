import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "~/db";
import { participants, teams } from "~/db/schema";
import { requireAdmin } from "~/lib/auth/check-access";
import { getCurrentActor } from "~/lib/mixpanel/getActor";
import { Entity, trackAudit } from "~/lib/mixpanel/tracker";

type RouteParams = {
    params: Promise<{ teamId: string; memberId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, memberId } = await params;
    const body = await request.json();

    if (body.isLeader) {
        await db
            .update(participants)
            .set({ isLeader: false })
            .where(eq(participants.teamId, teamId));
    }

    const [updated] = await db
        .update(participants)
        .set({ isLeader: body.isLeader })
        .where(eq(participants.id, memberId))
        .returning();

    if (!updated) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const actor = await getCurrentActor();

    const { memberId } = await params;

    const participant = await db.query.participants.findFirst({
        where: eq(participants.id, memberId),
    })

    if (!participant) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const teamDetails = await db.query.teams.findFirst({
        where: eq(teams.id, participant.teamId!),
    })

    if (!teamDetails) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const entity = {
        id: teamDetails.id,
        name: teamDetails.name,
        type: "Team",
    };

    const [updated] = await db
        .update(participants)
        .set({
            teamId: null,
            isLeader: false,
        })
        .where(eq(participants.id, memberId))
        .returning();

    trackAudit({
        actor,
        action: "- Remove Member",
        entity,
        previousValue: {
            "id": participant.id,
            "teamId": participant.teamId,
            "teamName": teamDetails.name,
            "memberName": participant.name,
            "isLeader": participant.isLeader,
        },
        newValue: {
            "id": participant.id,
            "teamId": updated.teamId,
            "teamName": "",
            "memberName": updated.name,
            "isLeader": updated.isLeader,
        },
    })

    if (!updated) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
}
