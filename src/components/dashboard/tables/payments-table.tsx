"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDownUp,
  CheckCircle2,
  Circle,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
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

type PaymentStatus = "Pending" | "Paid" | "Refunded" | null;

type Payment = {
  id: string;
  paymentStatus: PaymentStatus;
  paymentScreenshotUrl: string | null;
  paymentTransactionId: string | null;
  createdAt: string;
  team: { id: string; name: string } | null;
  user: { id: string; name: string | null; email: string | null } | null;
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
  sortOrder: string;
};

const columnHelper = createColumnHelper<Payment & { rowIndex: number }>();

function buildUrl(search: string, filters: Filters, page: number): string {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("limit", "20");
  if (search.trim()) params.set("search", search.trim());
  params.set("sortOrder", filters.sortOrder);

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
    sortOrder: "desc",
  });
  // Track locally which payments have been toggled for optimistic UI
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());

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

  const handleToggleVerify = useCallback(async (paymentId: string) => {
    setVerifyingIds((prev) => new Set(prev).add(paymentId));
    try {
      const res = await fetch(`/api/dashboard/payments/${paymentId}/verify`, {
        method: "PATCH",
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data: { paymentStatus: PaymentStatus };
      };
      const newStatus = json?.data?.paymentStatus;
      if (newStatus) {
        setData((prev) =>
          prev.map((p) =>
            p.id === paymentId ? { ...p, paymentStatus: newStatus } : p,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to toggle verification:", err);
    } finally {
      setVerifyingIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  }, []);

  const dataWithIndex = useMemo(
    () => data.map((p, i) => ({ ...p, rowIndex: i + 1 })),
    [data],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("rowIndex", {
        header: "#",
        cell: (info) => (
          <span className="text-muted-foreground text-sm">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.user?.name ?? row.user?.email ?? "—", {
        id: "userName",
        header: "User",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.team?.name ?? "—", {
        id: "teamName",
        header: "Team",
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("paymentTransactionId", {
        header: "Transaction ID",
        cell: (info) => {
          const val = info.getValue();
          return val ? (
            <span className="font-mono text-xs">{val}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      columnHelper.accessor("paymentScreenshotUrl", {
        header: "Screenshot",
        cell: (info) => {
          const url = info.getValue();
          if (!url)
            return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        },
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
          return <Badge variant="outline">{status ?? "N/A"}</Badge>;
        },
      }),
      columnHelper.display({
        id: "verify",
        header: "Verify",
        cell: ({ row }) => {
          const { id, paymentStatus } = row.original;
          const isPaid = paymentStatus === "Paid";
          const isProcessing = verifyingIds.has(id);
          return (
            <Button
              size="sm"
              variant={isPaid ? "default" : "outline"}
              disabled={isProcessing}
              onClick={() => void handleToggleVerify(id)}
              className={
                isPaid
                  ? "bg-green-600 text-white hover:bg-destructive gap-1 min-w-[90px] group transition-colors"
                  : "gap-1 min-w-[90px]"
              }
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 group-hover:hidden" />
                  <X className="h-3.5 w-3.5 hidden group-hover:block" />
                  <span className="group-hover:hidden">Verified</span>
                  <span className="hidden group-hover:block">Revoke</span>
                </>
              ) : (
                <>
                  <Circle className="h-3.5 w-3.5" />
                  <span>Verify</span>
                </>
              )}
            </Button>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      }),
    ],
    [verifyingIds, handleToggleVerify],
  );

  const table = useReactTable({
    data: dataWithIndex,
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

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters({ sortOrder: "desc" });
  }, []);

  const hasActiveFilters = search.trim() !== "" || filters.sortOrder !== "desc";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by team or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filters.sortOrder}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, sortOrder: v }))
            }
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
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows are fine
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
