import { redirect } from "next/navigation";
import { auth } from "~/auth/dashboard-config";
import { TeamsTable } from "~/components/dashboard/teams-table";
import db from "~/db";
import * as teamData from "~/db/data/teams";
import { teams } from "~/db/schema";
import { hasPermission, isAdmin } from "~/lib/auth/check-access";

async function getInitialTeams() {
  const allTeams = await db
    .select()
    .from(teams)
    .orderBy(teams.createdAt)
    .limit(51);

  const paginatedTeams = allTeams.slice(0, 50);
  const hasMore = allTeams.length > 50;
  const nextCursor = hasMore
    ? paginatedTeams[paginatedTeams.length - 1]?.id
    : null;

  const teamsWithCounts = await Promise.all(
    paginatedTeams.map(async (team) => {
      const members = await teamData.listMembers(team.id);
      return {
        ...team,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
        memberCount: members.length,
      };
    }),
  );

  return {
    teams: teamsWithCounts,
    nextCursor,
  };
}

export type UserPermissions = {
  isAdmin: boolean;
  canMarkAttendance: boolean;
  canViewTeams: boolean;
  canViewTeamDetails: boolean;
};

async function getUserPermissions(): Promise<UserPermissions> {
  const session = await auth();
  if (!session?.dashboardUser) {
    return {
      isAdmin: false,
      canMarkAttendance: false,
      canViewTeams: false,
      canViewTeamDetails: false,
    };
  }

  const userIsAdmin = isAdmin(session.dashboardUser);
  const [canMarkAttendance, canViewTeams, canViewTeamDetails] = await Promise.all([
    hasPermission("team:mark_attendance"),
    hasPermission(/^team:/),
    hasPermission("team:view_team_details"),
  ]);

  return {
    isAdmin: userIsAdmin,
    canMarkAttendance,
    canViewTeams,
    canViewTeamDetails,
  };
}

export default async function TeamsPage() {
  const session = await auth();

  if (!session?.dashboardUser) {
    redirect("/dashboard/login");
  }

  const permissions = await getUserPermissions();

  if (!permissions.canViewTeams && !permissions.isAdmin) {
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

      <TeamsTable initialData={initialData} permissions={permissions} />
    </div>
  );
}

