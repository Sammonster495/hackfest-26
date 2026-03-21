import { redirect } from "next/navigation";
import { auth, signOut } from "~/auth/dashboard-config";
import { DashboardContent } from "~/components/dashboard/dashboard-content";
import { LiveClock } from "~/components/dashboard/other/live-clock";
import {
  type DashboardPermissions,
  DashboardPermissionsProvider,
} from "~/components/dashboard/permissions-context";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { hasPermission, isAdmin } from "~/lib/auth/check-access";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.dashboardUser) {
    redirect("/dashboard/login");
  }

  const { dashboardUser } = session;

  const permissions: DashboardPermissions = {
    beAdmin: isAdmin(dashboardUser),
    isAdmin: hasPermission(dashboardUser, "dashboard:access"), // have to change name
    canManageSettings: hasPermission(dashboardUser, "settings:manage"),
    canManageRoles: hasPermission(dashboardUser, "roles:manage"),
    canViewAllTeams: hasPermission(dashboardUser, "team:view_all"),
    canViewTop60: hasPermission(dashboardUser, "team:view_top60"),
    canScoreSubmissions: hasPermission(dashboardUser, "submission:score"),
    canRemarkSubmissions: hasPermission(dashboardUser, "submission:remark"),
    canPromoteSelection: hasPermission(dashboardUser, "selection:promote"),
    canViewSelection: hasPermission(dashboardUser, "selection:view"),
    canMarkAttendance: hasPermission(dashboardUser, "attendance:mark"),
    canViewResults: hasPermission(dashboardUser, "results:view"),
    canManageEvents: hasPermission(dashboardUser, "event:manage"),
    canViewTeamDetails: hasPermission(dashboardUser, "team:view_team_details"),
    canViewColleges: hasPermission(dashboardUser, "colleges:manage"),
  };

  if (!permissions.isAdmin) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Welcome, {dashboardUser.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              You do not have the required permissions to access the dashboard.
              Please contact an administrator if you believe this is a mistake.
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/dashboard/login" });
              }}
            >
              <Button type="submit" variant="default" className="w-full">
                Logout
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardPermissionsProvider
      permissions={permissions}
      dashboardUser={dashboardUser}
    >
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {dashboardUser.name}
            </p>
          </div>
          <div className="flex-1 flex justify-start md:justify-center">
            <LiveClock />
          </div>
          <div className="flex-1 flex justify-start md:justify-end gap-2">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/dashboard/login" });
              }}
            >
              <Button type="submit" variant="outline">
                Logout
              </Button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{dashboardUser.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{dashboardUser.name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Your assigned roles</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardUser.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dashboardUser.roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-md bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium"
                    >
                      {role.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No roles assigned
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Your available permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardUser.roles.some((r) => r.permissions.length > 0) ? (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {Array.from(
                    new Set(
                      dashboardUser.roles.flatMap((role) =>
                        role.permissions.map((p) => p.key),
                      ),
                    ),
                  ).map((key) => (
                    <div
                      key={key}
                      className="rounded bg-muted px-2 py-1 text-xs font-crimson"
                    >
                      {key}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No permissions assigned
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <DashboardContent session={session} />
      </div>
    </DashboardPermissionsProvider>
  );
}
