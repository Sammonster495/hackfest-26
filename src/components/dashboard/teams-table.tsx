"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UserPermissions } from "~/app/dashboard/teams/page";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TeamDetailDialog } from "./team-detail-dialog";

type Team = {
  id: string;
  name: string;
  paymentStatus: string | null;
  attended: boolean;
  isCompleted: boolean;
  createdAt: string;
  memberCount: number;
};

type TeamsData = {
  teams: Team[];
  nextCursor: string | null;
};

type TeamsTableProps = {
  initialData: TeamsData;
  permissions: UserPermissions;
};

const columnHelper = createColumnHelper<Team>();

async function fetchTeams(cursor?: string): Promise<TeamsData> {
  const url = cursor
    ? `/api/dashboard/teams?cursor=${cursor}`
    : "/api/dashboard/teams";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

export function TeamsTable({ initialData, permissions }: TeamsTableProps) {
  const [data, setData] = useState<Team[]>(initialData.teams);
  const [cursor, setCursor] = useState<string | null>(initialData.nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [selectedTeamAttended, setSelectedTeamAttended] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Team Name",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("memberCount", {
        header: "Members",
        cell: (info) => <Badge variant="secondary">{info.getValue()}/4</Badge>,
      }),
      columnHelper.accessor("isCompleted", {
        header: "Status",
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="success">Completed</Badge>
          ) : (
            <Badge variant="warning">Incomplete</Badge>
          ),
      }),
      columnHelper.accessor("paymentStatus", {
        header: "Payment",
        cell: (info) => {
          const status = info.getValue();
          if (status === "Paid") return <Badge variant="success">Paid</Badge>;
          if (status === "Pending")
            return <Badge variant="warning">Pending</Badge>;
          return <Badge variant="outline">{status || "N/A"}</Badge>;
        },
      }),
      columnHelper.accessor("attended", {
        header: "Attended",
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="success">Yes</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 56,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const loadMore = useCallback(async () => {
    if (!cursor || isLoading) return;

    setIsLoading(true);
    try {
      const result = await fetchTeams(cursor);
      setData((prev) => [...prev, ...result.teams]);
      setCursor(result.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, isLoading]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor && !isLoading) {
          void loadMore();
        }
      },
      { root: container, threshold: 0.1 },
    );

    const sentinel = container.querySelector("[data-sentinel]");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [cursor, isLoading, loadMore]);

  const handleRowClick = useCallback((team: Team) => {
    setSelectedTeamId(team.id);
    setSelectedTeamName(team.name);
    setSelectedTeamAttended(team.attended);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setSelectedTeamId(null);
    setSelectedTeamName(null);
    setSelectedTeamAttended(false);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchTeams();
      setData(result.teams);
      setCursor(result.nextCursor);

      if (selectedTeamId) {
        const updatedTeam = result.teams.find((t) => t.id === selectedTeamId);
        if (updatedTeam) {
          setSelectedTeamAttended(updatedTeam.attended);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeamId]);

  return (
    <>
      <div
        ref={tableContainerRef}
        className="rounded-lg border bg-card overflow-auto"
        style={{ height: "calc(100vh - 220px)" }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {virtualRows.length > 0 ? (
              <>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(row.original)}
                      style={{
                        height: `${virtualRow.size}px`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {cursor && (
                  <TableRow data-sentinel>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-4 text-muted-foreground"
                    >
                      {isLoading ? "Loading more..." : "Scroll for more"}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No teams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TeamDetailDialog
        teamId={selectedTeamId}
        teamName={selectedTeamName}
        teamAttended={selectedTeamAttended}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}
        onUpdate={refreshData}
        permissions={permissions}
      />
    </>
  );
}
