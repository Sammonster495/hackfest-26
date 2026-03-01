import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "~/auth/dashboard-config";
import { TeamsTable } from "~/components/dashboard/tables/teams-table";
import { hasPermission, isAdmin } from "~/lib/auth/check-access";

export type UserPermissions = {
  isAdmin: boolean;
  canMarkAttendance: boolean;
  canViewTeams: boolean;
  canViewTeamDetails: boolean;
};

function getUserPermissions(
  dashboardUser: Session["dashboardUser"],
): UserPermissions {
  return {
    isAdmin: isAdmin(dashboardUser),
    canMarkAttendance: hasPermission(dashboardUser, "team:mark_attendance"),
    canViewTeams: hasPermission(dashboardUser, /^team:/),
    canViewTeamDetails: hasPermission(dashboardUser, "team:view_team_details"),
  };
}

export default async function TeamsPage() {
  const session = await auth();

  if (!session?.dashboardUser) {
    redirect("/dashboard/login");
  }

  const permissions = getUserPermissions(session.dashboardUser);

  if (!permissions.canViewTeams && !permissions.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Manage Teams</h1>
        <p className="text-muted-foreground">
          View and manage all hackathon teams
        </p>
      </div>

      <TeamsTable permissions={permissions} />
    </div>
  );
}
