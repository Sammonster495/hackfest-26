"use client";

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from "react";
import { Input } from "~/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

type College = {
    id: string;
    name: string;
    state: string | null;
};

type CollegesData = {
    colleges: College[];
    nextCursor: string | null;
    totalCount: number;
};

const columnHelper = createColumnHelper<College>();

function buildUrl(search: string, cursor?: string): string {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString();
    return qs ? `/api/dashboard/colleges?${qs}` : "/api/dashboard/colleges";
}

export function CollegesTable() {
    const [data, setData] = useState<College[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [totalCount, setTotalCount] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Client-side cache (Map to hold search string -> Cached Data)
    const cacheRef = useRef<Map<string, CollegesData>>(new Map());

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
                const cacheKey = `${debouncedSearch}-${cursorVal || "start"}`;

                // Use cache if not appending and query matches
                if (!append && cacheRef.current.has(cacheKey)) {
                    const cached = cacheRef.current.get(cacheKey)!;
                    setData(cached.colleges);
                    setCursor(cached.nextCursor);
                    setTotalCount(cached.totalCount);
                    setIsLoading(false);
                    return;
                }

                const url = buildUrl(debouncedSearch, cursorVal);
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch colleges");
                const result: CollegesData = await res.json();

                if (append) {
                    setData((prev) => {
                        const newData = [...prev, ...result.colleges];
                        // Cache the "load more" state as well if needed, though usually just caching initial searches is enough
                        return newData;
                    });
                } else {
                    setData(result.colleges);
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
        [debouncedSearch],
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
        window.addEventListener("invalidate-colleges-cache", handleInvalidate);
        return () => window.removeEventListener("invalidate-colleges-cache", handleInvalidate);
    }, [fetchData]);

    const columns = useMemo(
        () => [
            columnHelper.accessor("name", {
                header: "College Name",
                cell: (info) => <span className="font-medium">{info.getValue() || "Unnamed College"}</span>,
            }),
            columnHelper.accessor("state", {
                header: "State",
                cell: (info) => <span className="text-muted-foreground">{info.getValue() || "Unknown"}</span>,
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

    return (
        <>
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search colleges..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{isPending ? "Searching..." : `${totalCount} colleges found`}</span>
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
                                        ? "No colleges match your search."
                                        : "No colleges found."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
