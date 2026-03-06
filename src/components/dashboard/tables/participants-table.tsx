"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, Copy, Eye, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
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
import { TeamDetailDialog } from "../other/team-detail-dialog";

type Participant = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  course: string | null;
  isRegistrationComplete: boolean;
  createdAt: string;
  collegeName: string | null;
  hasTeam: boolean;
  teamId: string | null;
};

type ParticipantsData = {
  participants: Participant[];
  nextCursor: string | null;
  totalCount: number;
  registeredCount: number;
};

type Filters = {
  isRegistrationComplete: string;
  hasTeam: string;
  gender: string;
};

const columnHelper = createColumnHelper<Participant>();

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(id).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      title="Copy ID"
      className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

function CopyText({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(text).then(() => {
          toast.success("Copied to clipboard");
        });
      }}
      title={text}
      className="text-sm max-w-[180px] truncate block text-left cursor-pointer hover:text-foreground transition-colors"
    >
      {text}
    </button>
  );
}

function ViewTeamButton({ teamId }: { teamId: string | null }) {
  const [open, setOpen] = useState(false);
  if (!teamId) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="View team details"
        className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {open && (
        <TeamDetailDialog
          teamName={null}
          teamAttended={false}
          onUpdate={() => {}}
          teamId={teamId}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

function buildUrl(search: string, filters: Filters, cursor?: string): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (search.trim()) params.set("search", search.trim());
  if (filters.isRegistrationComplete !== "all")
    params.set("isRegistrationComplete", filters.isRegistrationComplete);
  if (filters.hasTeam !== "all") params.set("hasTeam", filters.hasTeam);
  if (filters.gender !== "all") params.set("gender", filters.gender);
  const qs = params.toString();
  return qs
    ? `/api/dashboard/participants?${qs}`
    : "/api/dashboard/participants";
}

export function ParticipantsTable() {
  const [data, setData] = useState<Participant[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [totalCount, setTotalCount] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    isRegistrationComplete: "all",
    hasTeam: "all",
    gender: "all",
  });

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
    async (append = false, cursorVal?: string, silent = false) => {
      if (!append && !silent) setIsLoading(true);
      try {
        const url = buildUrl(debouncedSearch, filters, cursorVal);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch participants");
        const result: ParticipantsData = await res.json();

        if (append) {
          setData((prev) => [...prev, ...result.participants]);
        } else {
          setData(result.participants);
        }
        setCursor(result.nextCursor);
        setTotalCount(result.totalCount);
        setRegisteredCount(result.registeredCount);
      } catch (err) {
        console.error(err);
      } finally {
        if (!silent) setIsLoading(false);
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
        header: "Name",
        cell: (info) => (
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{info.getValue() || "—"}</span>
            <CopyIdButton id={info.row.original.id} />
          </div>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => {
          const email = info.getValue();
          if (!email) return <span className="text-sm">—</span>;
          return <CopyText text={email} />;
        },
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: (info) => (
          <span className="text-sm">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("collegeName", {
        header: "College",
        cell: (info) => (
          <span className="text-sm max-w-[200px] truncate block">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("gender", {
        header: "Gender",
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <Badge variant="outline">—</Badge>;
          return <Badge variant="secondary">{val}</Badge>;
        },
      }),
      columnHelper.accessor("isRegistrationComplete", {
        header: "Registration",
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="success">Complete</Badge>
          ) : (
            <Badge variant="warning">Incomplete</Badge>
          ),
      }),
      columnHelper.accessor("hasTeam", {
        header: "Team",
        cell: (info) =>
          info.getValue() ? (
            <div className="flex items-center gap-1.5">
              <Badge variant="success">Yes</Badge>
              <ViewTeamButton teamId={info.row.original.teamId} />
            </div>
          ) : (
            <Badge variant="outline">No</Badge>
          ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Joined",
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
    estimateSize: () => 49,
    getScrollElement: () => tableContainerRef.current,
    overscan: 20,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

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

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters({
      isRegistrationComplete: "all",
      hasTeam: "all",
      gender: "all",
    });
  }, []);

  const hasActiveFilters =
    search.trim() !== "" ||
    filters.isRegistrationComplete !== "all" ||
    filters.hasTeam !== "all" ||
    filters.gender !== "all";

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select
              value={filters.isRegistrationComplete}
              onValueChange={(v) =>
                handleFilterChange("isRegistrationComplete", v)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Registration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Registration</SelectItem>
                <SelectItem value="true">Complete</SelectItem>
                <SelectItem value="false">Incomplete</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.hasTeam}
              onValueChange={(v) => handleFilterChange("hasTeam", v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="true">In Team</SelectItem>
                <SelectItem value="false">No Team</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.gender}
              onValueChange={(v) => handleFilterChange("gender", v)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gender</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Prefer Not To Say">
                  Prefer Not To Say
                </SelectItem>
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
          <span>{isPending ? "Searching..." : `${totalCount} total`}</span>
          <span>·</span>
          <span>{registeredCount} registered</span>
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
          <TableBody
            style={{
              height: virtualRows.length > 0 ? `${totalSize}px` : undefined,
            }}
          >
            {isLoading && data.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : virtualRows.length > 0 ? (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ height: paddingTop, padding: 0, border: 0 }}
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
                      className="hover:bg-muted/50 transition-colors"
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
                {paddingBottom > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ height: paddingBottom, padding: 0, border: 0 }}
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
                    ? "No participants match your filters."
                    : "No participants found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
