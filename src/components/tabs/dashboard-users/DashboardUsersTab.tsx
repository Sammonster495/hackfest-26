import { UsersTable } from "./UsersTable";

export function DashboardUsersTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Users</h2>
        <p className="text-muted-foreground">
          View all dashboard users and assign or revoke system roles.
        </p>
      </div>

      <UsersTable />
    </div>
  );
}
