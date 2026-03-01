"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { UserPermissions } from "~/app/dashboard/teams/page";
import { TeamDetailDialog } from "~/components/dashboard/other/team-detail-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

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
  totalCount: number;
  confirmedCount: number;
};

type Filters = {
  isCompleted: string;
  paymentStatus: string;
  attended: string;
};

type TeamsTableProps = {
  permissions: UserPermissions;
};

const columnHelper = createColumnHelper<Team>();

function buildUrl(
  search: string,
  filters: Filters,
  cursor?: string,
): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (search.trim()) params.set("search", search.trim());
  if (filters.isCompleted !== "all")
    params.set("isCompleted", filters.isCompleted);
  if (filters.paymentStatus !== "all")
    params.set("paymentStatus", filters.paymentStatus);
  if (filters.attended !== "all") params.set("attended", filters.attended);
  const qs = params.toString();
  return qs ? `/api/dashboard/teams?${qs}` : "/api/dashboard/teams";
}

export function TeamsTable({ permissions }: TeamsTableProps) {
  const [data, setData] = useState<Team[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [totalCount, setTotalCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    isCompleted: "all",
    paymentStatus: "all",
    attended: "all",
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [selectedTeamAttended, setSelectedTeamAttended] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const fetchData = useCallback(
    async (append = false, cursorVal?: string) => {
      if (!append) setIsLoading(true);
      try {
        const url = buildUrl(debouncedSearch, filters, cursorVal);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch teams");
        const result: TeamsData = await res.json();

        if (append) {
          setData((prev) => [...prev, ...result.teams]);
        } else {
          setData(result.teams);
        }
        setCursor(result.nextCursor);
        setTotalCount(result.totalCount);
        setConfirmedCount(result.confirmedCount);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, filters],
  );

  useEffect(() => {
    startTransition(() => {
      void fetchData(false);
    });
  }, [fetchData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Team Name",
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("memberCount", {
        header: "Members",
        cell: (info) => (
          <Badge variant="secondary">{info.getValue()}</Badge>
        ),
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
          if (status === "Paid")
            return <Badge variant="success">Paid</Badge>;
          if (status === "Pending")
            return <Badge variant="warning">Pending</Badge>;
          if (status === "Refunded")
            return <Badge variant="destructive">Refunded</Badge>;
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
    await fetchData(true, cursor);
  }, [cursor, isLoading, fetchData]);

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
    await fetchData(false);
    if (selectedTeamId) {
      setData((prev) => {
        const updated = prev.find((t) => t.id === selectedTeamId);
        if (updated) setSelectedTeamAttended(updated.attended);
        return prev;
      });
    }
  }, [fetchData, selectedTeamId]);

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters({
      isCompleted: "all",
      paymentStatus: "all",
      attended: "all",
    });
  }, []);

  const hasActiveFilters =
    search.trim() !== "" ||
    filters.isCompleted !== "all" ||
    filters.paymentStatus !== "all" ||
    filters.attended !== "all";

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select
              value={filters.isCompleted}
              onValueChange={(v) => handleFilterChange("isCompleted", v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Completed</SelectItem>
                <SelectItem value="false">Incomplete</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.paymentStatus}
              onValueChange={(v) => handleFilterChange("paymentStatus", v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.attended}
              onValueChange={(v) => handleFilterChange("attended", v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Attended" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attendance</SelectItem>
                <SelectItem value="true">Attended</SelectItem>
                <SelectItem value="false">Not Attended</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{isPending ? "Searching..." : `${totalCount} registered`}</span>
          <span>·</span>
          <span>{confirmedCount} confirmed</span>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="rounded-lg border bg-card overflow-auto"
        style={{ height: "calc(100vh - 200px)" }}
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
            {isLoading && data.length === 0 ? (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <TableCell key={`skeleton-${i}-${j}`}>
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : virtualRows.length > 0 ? (
              <>
                {virtualRows.length > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ height: virtualRows[0]?.start ?? 0, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <TableRow
                      key={row.id}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(row.original)}
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
                {virtualRows.length > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        height:
                          rowVirtualizer.getTotalSize() -
                          (virtualRows[virtualRows.length - 1]?.end ?? 0),
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}
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
                  {hasActiveFilters
                    ? "No teams match your filters."
                    : "No teams found."}
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
