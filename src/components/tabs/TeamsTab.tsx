"use client";

import { TeamsTable } from "~/components/dashboard/tables/teams-table";

export function TeamsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        <p className="text-muted-foreground">
          View and manage all hackathon teams
        </p>
      </div>
      <TeamsTable />
    </div>
  );
}
