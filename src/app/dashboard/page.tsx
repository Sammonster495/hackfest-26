import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "~/auth/dashboard-config";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { LiveClock } from "~/components/dashboard/live-clock";
import { hasPermission } from "~/lib/auth/check-access";
import { ArrowRightIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.dashboardUser) {
    redirect("/dashboard/login");
  }

  const { dashboardUser } = session;

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
        <div className="flex-1 flex justify-end">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="space-y-2">
                {dashboardUser.roles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-md bg-muted px-3 py-2 text-sm font-medium"
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
              <div className="space-y-2">
                {dashboardUser.roles.flatMap((role) =>
                  role.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{permission.key}</span>
                    </div>
                  )),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No permissions assigned
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {await hasPermission(/^team/i) && (
        <Link href="/dashboard/teams" className="block">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group">
            <div className="flex items-center justify-between p-6">
              <div className="flex-1">
                <CardTitle className="text-lg group-hover:text-primary transition-colors mb-1">
                  Manage Teams
                </CardTitle>
                <CardDescription>
                  View and manage all hackathon teams, payments, and attendance
                </CardDescription>
              </div>
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                <ArrowRightIcon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
}

