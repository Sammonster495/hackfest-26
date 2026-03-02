"use client";

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, Clock, Edit, Search, X } from "lucide-react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

type CollegeRequest = {
    id: string;
    requested_name: string;
    approved_name: string | null;
    state: string | null;
    status: "Pending" | "Approved" | "Rejected";
    createdAt: string;
};

type CollegeRequestsData = {
    requests: CollegeRequest[];
    nextCursor: string | null;
    totalCount: number;
};

const columnHelper = createColumnHelper<CollegeRequest>();

function buildUrl(search: string, status: string, cursor?: string): string {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (search.trim()) params.set("search", search.trim());
    params.set("status", status);
    const qs = params.toString();
    return qs ? `/api/dashboard/college-requests?${qs}` : "/api/dashboard/college-requests";
}

export function CollegeRequestsTable({
    statusMode,
}: {
    statusMode: "Pending" | "Approved" | "Rejected" | "all";
}) {
    const [data, setData] = useState<CollegeRequest[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [totalCount, setTotalCount] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Client-side cache (Map to hold search string + mode -> Cached Data)
    const cacheRef = useRef<Map<string, CollegeRequestsData>>(new Map());

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    // Confirmation State
    const [confirmApproval, setConfirmApproval] = useState<{
        id: string;
        name: string;
        source: "direct" | "edit";
    } | null>(null);

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
                const cacheKey = `${statusMode}-${debouncedSearch}-${cursorVal || "start"}`;

                // Use cache if not appending and query matches
                if (!append && cacheRef.current.has(cacheKey)) {
                    const cached = cacheRef.current.get(cacheKey)!;
                    setData(cached.requests);
                    setCursor(cached.nextCursor);
                    setTotalCount(cached.totalCount);
                    setIsLoading(false);
                    return;
                }

                const url = buildUrl(debouncedSearch, statusMode, cursorVal);
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch requests");
                const result: CollegeRequestsData = await res.json();

                if (append) {
                    setData((prev) => [...prev, ...result.requests]);
                } else {
                    setData(result.requests);
                    cacheRef.current.set(cacheKey, result);
                }
                setCursor(result.nextCursor);
                setTotalCount(result.totalCount);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        },
        [debouncedSearch, statusMode],
    );

    useEffect(() => {
        startTransition(() => {
            void fetchData(false);
        });
    }, [fetchData]);

    useEffect(() => {
        const handleInvalidate = () => {
            cacheRef.current.clear();
            void fetchData(false);
        };
        window.addEventListener("invalidate-college-requests-cache", handleInvalidate);
        return () => window.removeEventListener("invalidate-college-requests-cache", handleInvalidate);
    }, [fetchData]);

    const handleUpdateStatus = async (
        id: string,
        newStatus: "Pending" | "Approved" | "Rejected",
        apprName?: string
    ) => {
        setIsUpdating(true);
        try {
            const res = await fetch("/api/dashboard/college-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus, approvedName: apprName }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(`Request marked as ${newStatus}`);
            setEditingId(null);

            // Optimistically remove/update from list
            if (statusMode !== "all") {
                if (newStatus === statusMode) {
                    // Only updated the name, keep it in the list
                    setData((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus, approved_name: apprName ?? r.approved_name } : r));
                } else {
                    // Changed status, remove from this tab
                    setData((prev) => prev.filter((r) => r.id !== id));
                    setTotalCount((prev) => prev - 1);
                }
            } else {
                setData((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus, approved_name: apprName ?? r.approved_name } : r));
            }

            // Flush caches so that when user navigates to another active tab, it grabs fresh data
            window.dispatchEvent(new CustomEvent("invalidate-colleges-cache"));
            window.dispatchEvent(new CustomEvent("invalidate-college-requests-cache"));
            window.dispatchEvent(new CustomEvent("invalidate-counts-cache"));

        } catch (error) {
            console.error(error);
            toast.error("Failed to update college request");
        } finally {
            setIsUpdating(false);
        }
    };

    const startEdit = (req: CollegeRequest) => {
        setEditingId(req.id);
        setEditName(req.approved_name || req.requested_name);
    };

    const columns = useMemo(
        () => [
            columnHelper.accessor("requested_name", {
                header: "Requested Name",
                cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
            }),
            columnHelper.accessor("approved_name", {
                header: "Approved Name",
                cell: (info) => {
                    const req = info.row.original;
                    if (editingId === req.id) {
                        return (
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8 w-full max-w-[250px]"
                                autoFocus
                            />
                        );
                    }
                    return <span className="font-medium">{info.getValue() || req.requested_name}</span>;
                },
            }),
            columnHelper.accessor("status", {
                header: "Status",
                cell: (info) => {
                    const val = info.getValue();
                    if (val === "Approved") return <Badge variant="success">Approved</Badge>;
                    if (val === "Rejected") return <Badge variant="destructive">Rejected</Badge>;
                    return <Badge variant="warning">Pending</Badge>;
                }
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: (info) => {
                    const req = info.row.original;

                    if (editingId === req.id) {
                        return (
                            <div className="flex gap-2 items-center">
                                <Button
                                    size="sm"
                                    variant="default"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(req.id, req.status, editName)}
                                >
                                    Save
                                </Button>
                                {req.status !== "Approved" && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        disabled={isUpdating}
                                        onClick={() => setConfirmApproval({ id: req.id, name: editName, source: "edit" })}
                                    >
                                        Save & Approve
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={isUpdating}
                                    onClick={() => setEditingId(null)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )
                    }

                    return (
                        <div className="flex gap-2 items-center">
                            {req.status !== "Approved" && (
                                <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-black" onClick={() => startEdit(req)} title="Edit & Approve">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => setConfirmApproval({ id: req.id, name: req.approved_name || req.requested_name, source: "direct" })}
                                        title="Approve directly"
                                        disabled={isUpdating}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    {req.status !== "Rejected" && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleUpdateStatus(req.id, "Rejected", req.approved_name || undefined)}
                                            title="Reject"
                                            disabled={isUpdating}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {req.status !== "Pending" && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                            onClick={() => handleUpdateStatus(req.id, "Pending", req.approved_name || undefined)}
                                            title="Make Pending"
                                            disabled={isUpdating}
                                        >
                                            <Clock className="h-4 w-4" />
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    );
                },
            })
        ],
        [editingId, editName, isUpdating],
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

    return (
        <>
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search requests..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{isPending ? "Searching..." : `${totalCount} requests found`}</span>
                </div>
            </div>

            {/* Table */}
            <div
                ref={tableContainerRef}
                className="rounded-lg border bg-card overflow-auto"
                style={{ height: "calc(100vh - 250px)" }}
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
                            Array.from({ length: 8 }).map((_, i) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                                <TableRow key={`skeleton-${i}`}>
                                    <TableCell colSpan={columns.length}>
                                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                                    </TableCell>
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
                                    {search.trim() !== ""
                                        ? "No requests match your search."
                                        : "No requests found."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog
                open={!!confirmApproval}
                onOpenChange={(open) => !open && setConfirmApproval(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to approve this request? The college{" "}
                            <span className="font-bold text-foreground">
                                "{confirmApproval?.name}"
                            </span>{" "}
                            will be added to the official college list. This action cannot be
                            undone once approved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isUpdating}
                            onClick={(e) => {
                                e.preventDefault();
                                if (confirmApproval) {
                                    void handleUpdateStatus(
                                        confirmApproval.id,
                                        "Approved",
                                        confirmApproval.name,
                                    );
                                    setConfirmApproval(null);
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Confirm & Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
