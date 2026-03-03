"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDownUp, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
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

type Payment = {
  id: string;
  paymentName: string;
  paymentType: string;
  amount: string;
  paymentStatus: "Pending" | "Paid" | "Refunded" | null;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  createdAt: string;
  team: { id: string; name: string } | null;
  user: { id: string; name: string | null; email: string | null } | null;
  eventTeam: { id: string; name: string } | null;
  eventUser: {
    user: { id: string; name: string | null; email: string | null } | null;
  } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PaymentsData = {
  payments: Payment[];
  pagination: Pagination;
};

type Filters = {
  status: string;
  sortOrder: string;
  type: string;
};

const columnHelper = createColumnHelper<Payment>();

function buildUrl(search: string, filters: Filters, page: number): string {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("limit", "20");
  if (search.trim()) params.set("search", search.trim());
  if (filters.status !== "all") params.set("status", filters.status);
  params.set("sortOrder", filters.sortOrder);
  params.set("type", filters.type);

  const qs = params.toString();
  return qs ? `/api/dashboard/payments?${qs}` : "/api/dashboard/payments";
}

export function PaymentsTable() {
  const [data, setData] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    sortOrder: "desc",
    type: "PARTICIPATION",
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
    async (append = false, pageVal = 1) => {
      if (!append) setIsLoading(true);
      try {
        const url = buildUrl(debouncedSearch, filters, pageVal);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch payments");
        const result: PaymentsData = await res.json();

        if (append) {
          setData((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newPayments = result.payments.filter(
              (p) => !existingIds.has(p.id),
            );
            return [...prev, ...newPayments];
          });
        } else {
          setData(result.payments);
        }
        setPagination(result.pagination);
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
      void fetchData(false, 1);
    });
  }, [fetchData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (row) => row.team?.name ?? row.eventTeam?.name ?? "—",
        {
          id: "teamName",
          header: "Team",
          cell: (info) => (
            <span className="font-medium">{info.getValue()}</span>
          ),
        },
      ),
      columnHelper.accessor(
        (row) =>
          row.user?.name ??
          row.user?.email ??
          row.eventUser?.user?.name ??
          row.eventUser?.user?.email ??
          "—",
        {
          id: "payer",
          header: "Payer",
          cell: (info) => <span>{info.getValue()}</span>,
        },
      ),
      columnHelper.accessor("paymentType", {
        header: "Type",
        cell: (info) => {
          const type = info.getValue() || "N/A";
          if (type === "PARTICIPATION")
            return <Badge variant="secondary">Participation</Badge>;
          if (type === "EVENT") return <Badge variant="outline">Event</Badge>;
          return <Badge variant="outline">{type}</Badge>;
        },
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => (
          <span className="font-crimson flex items-center gap-1">
            ₹{info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("paymentStatus", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          if (status === "Paid") return <Badge variant="success">Paid</Badge>;
          if (status === "Pending")
            return <Badge variant="warning">Pending</Badge>;
          if (status === "Refunded")
            return <Badge variant="destructive">Refunded</Badge>;
          return <Badge variant="outline">{status || "N/A"}</Badge>;
        },
      }),
      columnHelper.accessor("razorpayOrderId", {
        header: "Order ID",
        cell: (info) => (
          <span className="font-crimson text-xs text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
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
    if (pagination.page >= pagination.totalPages || isLoading) return;
    await fetchData(true, pagination.page + 1);
  }, [pagination.page, pagination.totalPages, isLoading, fetchData]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          pagination.page < pagination.totalPages &&
          !isLoading
        ) {
          void loadMore();
        }
      },
      { root: container, threshold: 0.1 },
    );

    const sentinel = container.querySelector("[data-sentinel]");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [pagination.page, pagination.totalPages, isLoading, loadMore]);

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters({
      status: "all",
      sortOrder: "desc",
      type: "PARTICIPATION",
    });
  }, []);

  const hasActiveFilters =
    search.trim() !== "" ||
    filters.status !== "all" ||
    filters.sortOrder !== "desc" ||
    filters.type !== "PARTICIPATION";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by team, payer, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filters.type}
            onValueChange={(v) => handleFilterChange("type", v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Payments</SelectItem>
              <SelectItem value="PARTICIPATION">Participation</SelectItem>
              <SelectItem value="EVENT">Event</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) => handleFilterChange("status", v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortOrder}
            onValueChange={(v) => handleFilterChange("sortOrder", v)}
          >
            <SelectTrigger className="w-[140px]">
              <ArrowDownUp className="size-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
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
        <span>
          {isPending ? "Searching..." : `${pagination.total} payments found`}
        </span>
      </div>

      <div
        ref={tableContainerRef}
        className="rounded-lg border bg-card overflow-auto"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
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
              Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: it is fine for skeleton rows
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fine for skeletons
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : virtualRows.length > 0 ? (
              <>
                {virtualRows.length > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        height: virtualRows[0]?.start ?? 0,
                        padding: 0,
                        border: 0,
                      }}
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
                {pagination.page < pagination.totalPages && (
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
                    ? "No payments match your filters."
                    : "No payments found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
