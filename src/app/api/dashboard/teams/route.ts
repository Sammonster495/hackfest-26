import { NextResponse } from "next/server";
import db from "~/db";
import * as teamData from "~/db/data/teams";
import { teams } from "~/db/schema";
import { hasPermission } from "~/lib/auth/check-access";

export async function GET(request: Request) {
    const hasAccess = await hasPermission("team:view_all");
    if (!hasAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Number(searchParams.get("limit")) || 50;

    const allTeams = await db
        .select()
        .from(teams)
        .orderBy(teams.createdAt)
        .limit(limit + 1);

    let startIndex = 0;
    if (cursor) {
        startIndex = allTeams.findIndex((t) => t.id === cursor) + 1;
    }

    const paginatedTeams = allTeams.slice(startIndex, startIndex + limit);
    const hasMore = allTeams.length > startIndex + limit;
    const nextCursor = hasMore
        ? paginatedTeams[paginatedTeams.length - 1]?.id
        : null;

    const teamsWithCounts = await Promise.all(
        paginatedTeams.map(async (team) => {
            const members = await teamData.listMembers(team.id);
            return {
                ...team,
                memberCount: members.length,
            };
        })
    );

    return NextResponse.json({
        teams: teamsWithCounts,
        nextCursor,
    });
}
