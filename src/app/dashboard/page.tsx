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

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.dashboardUser) {
    redirect("/dashboard/login");
  }

  const { dashboardUser } = session;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {dashboardUser.name}
          </p>
        </div>
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
    </div>
  );
}
