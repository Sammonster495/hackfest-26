"use client";

import { ParticipantsTable } from "~/components/dashboard/tables/participants-table";

export function ParticipantsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Participants</h2>
        <p className="text-muted-foreground">
          View and manage all hackathon participants
        </p>
      </div>
      <ParticipantsTable />
    </div>
  );
}
