"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Allocation = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamStage: string;
  paymentStatus: string | null;
  roundId: string;
  roundName: string;
  roundStatus: "Draft" | "Active" | "Completed";
  pptUrl: string | null;
  trackName: string | null;
  scoredCriteria: number;
  totalCriteria: number;
  totalRawScore: number;
  totalMaxScore: number;
};

type ScoreCriterion = {
  id: string;
  criteriaName: string;
  maxScore: number;
  rawScore: number;
};

type ScoreDialogPayload = {
  assignmentId: string;
  roundStatus: "Draft" | "Active" | "Completed";
  criteria: ScoreCriterion[];
};

function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SubmissionsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [selectedAllocation, setSelectedAllocation] =
    useState<Allocation | null>(null);
  const [scoreDialogPayload, setScoreDialogPayload] =
    useState<ScoreDialogPayload | null>(null);

  const fetchAllocations = async () => {
    const res = await fetch("/api/dashboard/judge/my-allocations");
    if (!res.ok) {
      setAllocations([]);
      return;
    }

    const data = (await res.json()) as Allocation[];
    setAllocations(data);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial fetch
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await fetchAllocations();
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  const openScoreDialog = async (allocation: Allocation) => {
    try {
      setSelectedAllocation(allocation);
      setIsScoreDialogOpen(true);
      setIsLoadingScores(true);

      const res = await fetch(
        `/api/dashboard/judge/scores?assignmentId=${encodeURIComponent(allocation.assignmentId)}`,
      );

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to load score criteria");
      }

      const payload = (await res.json()) as ScoreDialogPayload;
      setScoreDialogPayload(payload);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load score criteria",
      );
      setIsScoreDialogOpen(false);
      setSelectedAllocation(null);
      setScoreDialogPayload(null);
    } finally {
      setIsLoadingScores(false);
    }
  };

  const updateCriterionScore = (criteriaId: string, value: string) => {
    if (!scoreDialogPayload) return;

    const parsed = value === "" ? 0 : Number(value);
    setScoreDialogPayload({
      ...scoreDialogPayload,
      criteria: scoreDialogPayload.criteria.map((criterion) =>
        criterion.id === criteriaId
          ? {
              ...criterion,
              rawScore: Number.isFinite(parsed) ? parsed : criterion.rawScore,
            }
          : criterion,
      ),
    });
  };

  const handleSaveScores = async () => {
    if (!scoreDialogPayload) return;

    for (const criterion of scoreDialogPayload.criteria) {
      if (!Number.isInteger(criterion.rawScore) || criterion.rawScore < 0) {
        toast.error("Scores must be non-negative integers");
        return;
      }
      if (criterion.rawScore > criterion.maxScore) {
        toast.error(
          `${criterion.criteriaName} score cannot exceed ${criterion.maxScore}`,
        );
        return;
      }
    }

    try {
      setIsSavingScores(true);
      const res = await fetch("/api/dashboard/judge/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: scoreDialogPayload.assignmentId,
          scores: scoreDialogPayload.criteria.map((criterion) => ({
            criteriaId: criterion.id,
            rawScore: criterion.rawScore,
          })),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save scores");
      }

      toast.success("Scores saved");
      await fetchAllocations();
      setIsScoreDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save scores",
      );
    } finally {
      setIsSavingScores(false);
    }
  };

  const grouped = useMemo(() => {
    const statusPriority: Record<Allocation["roundStatus"], number> = {
      Active: 0,
      Draft: 1,
      Completed: 2,
    };

    const map = new Map<string, Allocation[]>();
    for (const item of allocations) {
      const key = `${item.roundId}|${item.roundName}|${item.roundStatus}`;
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }

    return Array.from(map.entries())
      .map(([key, items]) => {
        const [roundId, roundName, roundStatus] = key.split("|");
        const typedStatus = roundStatus as Allocation["roundStatus"];
        return {
          roundId,
          roundName,
          roundStatus: typedStatus,
          items: items.sort((a, b) => a.teamName.localeCompare(b.teamName)),
        };
      })
      .sort((a, b) => {
        const byStatus = statusPriority[a.roundStatus] - statusPriority[b.roundStatus];
        if (byStatus !== 0) return byStatus;
        return a.roundName.localeCompare(b.roundName);
      });
  }, [allocations]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Scoring</h2>
        <p className="text-muted-foreground">
          Teams allocated to you for judge scoring.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading assigned teams...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No teams are allocated to your judge account yet. Ask admin to assign
          teams in Judge Setup.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.roundId} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{group.roundName}</h3>
                <Badge variant="secondary">{group.roundStatus}</Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Track</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Criteria</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item) => (
                      <TableRow key={item.assignmentId}>
                        <TableCell className="font-medium">{item.teamName}</TableCell>
                        <TableCell>{item.trackName ?? "-"}</TableCell>
                        <TableCell>{formatEnumLabel(item.teamStage)}</TableCell>
                        <TableCell>
                          {item.pptUrl ? (
                            <a
                              href={item.pptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4"
                            >
                              View PPT
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Not submitted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.scoredCriteria}/{item.totalCriteria}
                        </TableCell>
                        <TableCell>
                          {item.totalRawScore}/{item.totalMaxScore}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openScoreDialog(item)}
                            disabled={item.roundStatus === "Completed"}
                          >
                            {item.scoredCriteria > 0 ? "Edit Score" : "Enter Score"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isScoreDialogOpen}
        onOpenChange={(open) => {
          setIsScoreDialogOpen(open);
          if (!open) {
            setSelectedAllocation(null);
            setScoreDialogPayload(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAllocation?.teamName
                ? `Score Team: ${selectedAllocation.teamName}`
                : "Score Team"}
            </DialogTitle>
            <DialogDescription>
              Enter criteria-wise scores for this team.
            </DialogDescription>
          </DialogHeader>

          {isLoadingScores ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading criteria...
            </div>
          ) : !scoreDialogPayload ? (
            <p className="text-sm text-muted-foreground">No score data available.</p>
          ) : (
            <div className="space-y-4">
              {scoreDialogPayload.roundStatus === "Completed" ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
                  This round is completed. Scores are locked.
                </div>
              ) : null}

              {scoreDialogPayload.criteria.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No criteria configured for this round.
                </p>
              ) : (
                <div className="space-y-3">
                  {scoreDialogPayload.criteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-5"
                    >
                      <div className="sm:col-span-3">
                        <p className="text-sm font-medium">{criterion.criteriaName}</p>
                        <p className="text-xs text-muted-foreground">
                          Max score: {criterion.maxScore}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          min={0}
                          max={criterion.maxScore}
                          step={1}
                          value={criterion.rawScore}
                          onChange={(e) =>
                            updateCriterionScore(criterion.id, e.target.value)
                          }
                          disabled={scoreDialogPayload.roundStatus === "Completed"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsScoreDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveScores}
                  disabled={
                    isSavingScores ||
                    scoreDialogPayload.roundStatus === "Completed" ||
                    scoreDialogPayload.criteria.length === 0
                  }
                >
                  {isSavingScores ? "Saving..." : "Save Scores"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
