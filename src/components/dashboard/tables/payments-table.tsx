"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
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

type PaymentsTableProps = {
  initialData?: PaymentsData;
};

const columnHelper = createColumnHelper<Payment>();

async function fetchPayments(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortOrder?: string;
}): Promise<PaymentsData> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const res = await fetch(`/api/dashboard/payments?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
}

const emptyData: PaymentsData = {
  payments: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

export function PaymentsTable({ initialData = emptyData }: PaymentsTableProps) {
  const [data, setData] = useState<Payment[]>(initialData.payments);
  const [pagination, setPagination] = useState<Pagination>(
    initialData.pagination,
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(
    async (page: number) => {
      startTransition(async () => {
        try {
          const result = await fetchPayments({
            page,
            limit: 20,
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: debouncedSearch || undefined,
            sortOrder,
          });
          setData(result.payments);
          setPagination(result.pagination);
        } catch (error) {
          console.error("Failed to load payments:", error);
        }
      });
    },
    [statusFilter, debouncedSearch, sortOrder],
  );

  useEffect(() => {
    void loadData(1);
    console.log("check");
  }, [loadData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.team?.name ?? "—", {
        id: "teamName",
        header: "Team",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.user?.name ?? row.user?.email ?? "—", {
        id: "payer",
        header: "Payer",
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => (
          <span className="font-crimson">₹{info.getValue()}</span>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by team, payer, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[140px]">
            <ArrowDownUp className="size-4 mr-1" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {pagination.total} payment{pagination.total !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-auto">
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isPending ? "Loading..." : "No payments found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || isPending}
              onClick={() => void loadData(pagination.page - 1)}
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || isPending}
              onClick={() => void loadData(pagination.page + 1)}
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
