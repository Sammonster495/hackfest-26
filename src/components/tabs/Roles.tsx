import { RolesTable } from "./roles/RolesTable";

export function RolesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Roles & Permissions
        </h2>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <RolesTable />
    </div>
  );
}
