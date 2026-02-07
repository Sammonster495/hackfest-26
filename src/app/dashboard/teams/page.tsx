import { redirect } from "next/navigation";
import { auth } from "~/auth/dashboard-config";
import { TeamsTable } from "~/components/dashboard/teams-table";
import { fetchTeams } from "~/db/services/team-services";
import { hasPermission, isAdmin } from "~/lib/auth/check-access";

async function getInitialTeams() {
  const { teams, nextCursor } = await fetchTeams({ limit: 50 });

  return {
    teams: teams.map((team) => ({
      ...team,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    })),
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
  const canMarkAttendance = hasPermission(
    session.dashboardUser,
    "team:mark_attendance",
  );
  const canViewTeams = hasPermission(session.dashboardUser, /^team:/);
  const canViewTeamDetails = hasPermission(
    session.dashboardUser,
    "team:view_team_details",
  );

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
