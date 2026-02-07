import { redirect } from "next/navigation";
import { auth, signOut } from "~/auth/dashboard-config";
import { DashboardContent } from "~/components/dashboard/dashboard-content";
import { LiveClock } from "~/components/dashboard/live-clock";
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
  const userIsAdmin = isAdmin(dashboardUser);

  const permissions = {
    isAdmin: userIsAdmin,
    // Settings & Management
    canManageSettings:
      userIsAdmin || hasPermission(dashboardUser, "settings:manage"),
    canManageRoles: userIsAdmin || hasPermission(dashboardUser, "roles:manage"),
    // Team visibility
    canViewAllTeams:
      userIsAdmin || hasPermission(dashboardUser, "team:view_all"),
    canViewTop60:
      userIsAdmin || hasPermission(dashboardUser, "team:view_top60"),
    // Submissions
    canScoreSubmissions:
      userIsAdmin || hasPermission(dashboardUser, "submission:score"),
    canRemarkSubmissions:
      userIsAdmin || hasPermission(dashboardUser, "submission:remark"),
    // Selection
    canPromoteSelection:
      userIsAdmin || hasPermission(dashboardUser, "selection:promote"),
    canViewSelection:
      userIsAdmin || hasPermission(dashboardUser, "selection:view"),
    // Attendance
    canMarkAttendance:
      userIsAdmin || hasPermission(dashboardUser, "attendance:mark"),
    // Results
    canViewResults: userIsAdmin || hasPermission(dashboardUser, "results:view"),
  };

  const hasDashboardAccess =
    userIsAdmin || hasPermission(dashboardUser, "dashboard:access");

  if (!hasDashboardAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">
              You do not have access to the dashboard. Contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {dashboardUser.name}
          </p>
        </div>
        <div className="flex-1 flex justify-center">
          <LiveClock />
        </div>
        <div className="flex-1 flex justify-end gap-2">
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
              <p className="text-sm text-muted-foreground">No roles assigned</p>
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
                    className="rounded bg-muted px-2 py-1 text-xs font-mono"
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

      <DashboardContent permissions={permissions} />
    </div>
  );
}
