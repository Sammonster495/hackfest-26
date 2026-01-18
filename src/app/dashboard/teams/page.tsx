import { redirect } from "next/navigation";
import db from "~/db";
import * as teamData from "~/db/data/teams";
import { teams } from "~/db/schema";
import { auth } from "~/auth/dashboard-config";
import { isAdmin } from "~/lib/auth/check-access";
import { TeamsTable } from "~/components/dashboard/teams-table";

async function getInitialTeams() {
    const allTeams = await db
        .select()
        .from(teams)
        .orderBy(teams.createdAt)
        .limit(51);

    const paginatedTeams = allTeams.slice(0, 50);
    const hasMore = allTeams.length > 50;
    const nextCursor = hasMore ? paginatedTeams[paginatedTeams.length - 1]?.id : null;

    const teamsWithCounts = await Promise.all(
        paginatedTeams.map(async (team) => {
            const members = await teamData.listMembers(team.id);
            return {
                ...team,
                createdAt: team.createdAt.toISOString(),
                updatedAt: team.updatedAt.toISOString(),
                memberCount: members.length,
            };
        })
    );

    return {
        teams: teamsWithCounts,
        nextCursor,
    };
}

export default async function TeamsPage() {
    const session = await auth();

    if (!session?.dashboardUser) {
        redirect("/dashboard/login");
    }

    if (!isAdmin(session.dashboardUser)) {
        redirect("/dashboard");
    }

    const initialData = await getInitialTeams();

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Manage Teams</h1>
                    <p className="text-muted-foreground">
                        View and manage all hackathon teams
                    </p>
                </div>
            </div>

            <TeamsTable initialData={initialData} />
        </div>
    );
}
