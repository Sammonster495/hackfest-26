"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
import type { IdeaRound } from "./types";

type RoleCandidate = {
  id: string;
  name: string;
  hasEvaluatorAccess: boolean;
};

type EvaluatorAllocation = {
  teamId: string;
  teamName: string;
  trackName: string | null;
  isAssigned: boolean;
  hasScored: boolean;
  rawTotalScore: number | null;
  normalizedTotalScore: number | null;
  assignedEvaluatorCount: number;
};

type EvaluatorUser = {
  id: string;
  name: string;
  email: string;
  roles: { id: string; name: string }[];
};

export function EvaluatorAllocationsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [rounds, setRounds] = useState<IdeaRound[]>([]);
  const [_roles, setRoles] = useState<RoleCandidate[]>([]);
  const [users, setUsers] = useState<EvaluatorUser[]>([]);

  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string>("");

  const [allocations, setAllocations] = useState<EvaluatorAllocation[]>([]);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "default" | "evaluatorsAsc" | "evaluatorsDesc"
  >("default");

  const fetchData = async () => {
    try {
      const [roundsRes, rolesRes, usersRes] = await Promise.all([
        fetch("/api/dashboard/idea-rounds"),
        fetch("/api/dashboard/submissions/settings"),
        fetch("/api/dashboard/users"),
      ]);

      if (!roundsRes.ok || !rolesRes.ok || !usersRes.ok)
        throw new Error("Failed to fetch data");

      const roundsData = await roundsRes.json();
      const rolesData = await rolesRes.json();
      const usersData = await usersRes.json();

      setRounds(roundsData);
      setRoles(rolesData.roles);

      const evaluatorRoleIds = new Set(
        rolesData.roles
          .filter((r: RoleCandidate) => r.hasEvaluatorAccess)
          .map((r: RoleCandidate) => r.id),
      );

      const evaluatorUsers = usersData.filter((u: any) =>
        u.roles.some((r: any) => evaluatorRoleIds.has(r.id)),
      );

      setUsers(evaluatorUsers);

      if (roundsData.length > 0 && !selectedRoundId) {
        setSelectedRoundId(roundsData[0].id);
      }
    } catch {
      toast.error("Failed to load evaluator settings summary");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: MM
  useEffect(() => {
    void fetchData();
  }, []);

  const fetchAllocations = async (roundId: string, evaluatorId: string) => {
    if (!roundId || !evaluatorId) {
      setAllocations([]);
      return;
    }
    setIsLoadingAllocations(true);
    try {
      const res = await fetch(
        `/api/dashboard/idea-rounds/evaluator-allocations?roundId=${roundId}&evaluatorId=${evaluatorId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch allocations");
      const data = await res.json();
      setAllocations(data);
      setPage(1);
    } catch {
      toast.error("Failed to load allocations");
    } finally {
      setIsLoadingAllocations(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    void fetchAllocations(selectedRoundId, selectedEvaluatorId);
  }, [selectedRoundId, selectedEvaluatorId]);

  const handleAction = async (
    teamId: string,
    action: "assign" | "deallocate",
  ) => {
    if (!selectedRoundId || !selectedEvaluatorId) return;

    try {
      setActionInProgress(teamId);
      const res = await fetch(
        "/api/dashboard/idea-rounds/evaluator-allocations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roundId: selectedRoundId,
            evaluatorId: selectedEvaluatorId,
            teamId,
            action,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Failed to ${action} team`);
      }

      toast.success(
        action === "assign"
          ? "Team assigned successfully"
          : "Team deallocated successfully",
      );

      setAllocations((prev) =>
        prev.map((a) => {
          if (a.teamId === teamId) {
            return {
              ...a,
              isAssigned: action === "assign",
              assignedEvaluatorCount:
                action === "assign"
                  ? a.assignedEvaluatorCount + 1
                  : Math.max(0, a.assignedEvaluatorCount - 1),
            };
          }
          return a;
        }),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${action} team`,
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredAllocations = useMemo(() => {
    let result = allocations;
    if (filter === "assigned") {
      result = allocations.filter((a) => a.isAssigned);
    } else if (filter === "unassigned") {
      result = allocations.filter((a) => !a.isAssigned);
    }

    return [...result].sort((a, b) => {
      if (sortBy === "evaluatorsAsc") {
        return a.assignedEvaluatorCount - b.assignedEvaluatorCount;
      }
      if (sortBy === "evaluatorsDesc") {
        return b.assignedEvaluatorCount - a.assignedEvaluatorCount;
      }

      if (a.normalizedTotalScore !== null && b.normalizedTotalScore !== null) {
        return b.normalizedTotalScore - a.normalizedTotalScore;
      }
      if (a.normalizedTotalScore !== null) return -1;
      if (b.normalizedTotalScore !== null) return 1;

      return (b.isAssigned ? 1 : 0) - (a.isAssigned ? 1 : 0);
    });
  }, [allocations, filter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAllocations.length / pageSize),
  );
  const paginatedAllocations = filteredAllocations.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border p-8">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">Evaluation Round</p>
                <Select
                  value={selectedRoundId}
                  onValueChange={setSelectedRoundId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a round" />
                  </SelectTrigger>
                  <SelectContent>
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name} ({round.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">Evaluator</p>
                <Select
                  value={selectedEvaluatorId}
                  onValueChange={setSelectedEvaluatorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an evaluator" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) =>
                        selectedRound
                          ? user.roles.some((r) => r.id === selectedRound.roleId)
                          : true
                      )
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    {users.filter((user) =>
                      selectedRound
                        ? user.roles.some((r) => r.id === selectedRound.roleId)
                        : true
                    ).length === 0 && (
                      <SelectItem value="none" disabled>
                        No evaluators found for this role
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedRound && selectedRound.status === "Completed" && (
              <div className="rounded-md border p-3 border-amber-200 bg-amber-50 dark:bg-amber-950/50">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  This round is marked as Completed. You cannot change
                  allocations.
                </p>
              </div>
            )}

            {!selectedRoundId || !selectedEvaluatorId ? (
              <div className="flex items-center justify-center rounded-md border p-8 text-sm text-muted-foreground">
                Select a round and an evaluator to view allocations.
              </div>
            ) : isLoadingAllocations ? (
              <div className="flex items-center justify-center rounded-md border p-8">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading allocations...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                      Target Stage: {selectedRound?.targetStage || "N/A"}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      Total Submissions: {allocations.length}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={filter}
                      onValueChange={(v: any) => {
                        setFilter(v);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Submissions</SelectItem>
                        <SelectItem value="assigned">
                          Assigned to User
                        </SelectItem>
                        <SelectItem value="unassigned">Not Assigned</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={sortBy}
                      onValueChange={(v: any) => {
                        setSortBy(v);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Sort</SelectItem>
                        <SelectItem value="evaluatorsAsc">
                          Fewest Evaluators
                        </SelectItem>
                        <SelectItem value="evaluatorsDesc">
                          Most Evaluators
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead>Track</TableHead>
                        <TableHead className="text-center">
                          Total Evaluators
                        </TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Raw Total</TableHead>
                        <TableHead className="text-right">Z-Score</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAllocations.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No submissions found matching criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedAllocations.map((alloc) => (
                          <TableRow key={alloc.teamId}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {alloc.teamName}
                            </TableCell>
                            <TableCell>
                              {alloc.trackName || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  alloc.assignedEvaluatorCount < 3
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {alloc.assignedEvaluatorCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {alloc.isAssigned ? (
                                <Badge variant="success">Assigned</Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Unassigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {alloc.hasScored &&
                              alloc.rawTotalScore !== null ? (
                                alloc.rawTotalScore.toFixed(0)
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {alloc.hasScored &&
                              alloc.normalizedTotalScore !== null ? (
                                (alloc.normalizedTotalScore >= 0 ? "+" : "") +
                                alloc.normalizedTotalScore.toFixed(3)
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {alloc.isAssigned ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={
                                    alloc.hasScored ||
                                    actionInProgress === alloc.teamId ||
                                    selectedRound?.status === "Completed"
                                  }
                                  onClick={() =>
                                    handleAction(alloc.teamId, "deallocate")
                                  }
                                >
                                  {actionInProgress === alloc.teamId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Deallocate"
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    actionInProgress === alloc.teamId ||
                                    selectedRound?.status === "Completed"
                                  }
                                  onClick={() =>
                                    handleAction(alloc.teamId, "assign")
                                  }
                                >
                                  {actionInProgress === alloc.teamId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Assign"
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {filteredAllocations.length > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Rows per page</span>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(v) => {
                          setPageSize(Number(v));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>
                        Page {page} of {totalPages} (
                        {filteredAllocations.length} rows)
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <span className="sr-only">Previous page</span>
                          &lt;
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                        >
                          <span className="sr-only">Next page</span>
                          &gt;
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
