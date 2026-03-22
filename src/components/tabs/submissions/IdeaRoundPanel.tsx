"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import type { IdeaAllocation } from "./types";

interface IdeaRoundPanelProps {
  allocations: IdeaAllocation[];
  onScoresSaved: () => void;
}

export function IdeaRoundPanel({
  allocations,
  onScoresSaved,
}: IdeaRoundPanelProps) {
  const [scoringAssignmentId, setScoringAssignmentId] = useState<string | null>(
    null,
  );
  const [criteria, setCriteria] = useState<
    Array<{
      id: string;
      criteriaName: string;
      maxScore: number;
      rawScore: number;
    }>
  >([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [savingScores, setSavingScores] = useState(false);

  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const uniqueTracks = Array.from(
    new Set(allocations.map((a) => a.trackName).filter(Boolean)),
  ) as string[];

  const filteredAllocations = useMemo(() => {
    const result = allocations.filter((alloc) => {
      if (trackFilter !== "all" && alloc.trackName !== trackFilter)
        return false;
      if (
        scoreFilter === "scored" &&
        alloc.scoredCriteria !== alloc.totalCriteria
      )
        return false;
      if (
        scoreFilter === "pending" &&
        alloc.scoredCriteria === alloc.totalCriteria
      )
        return false;
      return true;
    });

    result.sort((a, b) => {
      const trackA = a.trackName || "";
      const trackB = b.trackName || "";
      if (trackA !== trackB) {
        return trackA.localeCompare(trackB);
      }
      return a.teamName.localeCompare(b.teamName);
    });

    setCurrentPage(1);
    return result;
  }, [allocations, trackFilter, scoreFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAllocations.length / pageSize),
  );
  const paginatedAllocations = filteredAllocations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const activeAllocation = allocations.find(
    (a) => a.assignmentId === scoringAssignmentId,
  );

  const openScoreDialog = async (assignmentId: string) => {
    setScoringAssignmentId(assignmentId);
    setLoadingCriteria(true);
    try {
      const res = await fetch(
        `/api/dashboard/idea-rounds/scores?assignmentId=${assignmentId}`,
      );
      if (!res.ok) throw new Error("Failed to load criteria");
      const data = await res.json();
      setCriteria(data.criteria);
    } catch {
      toast.error("Failed to load scoring criteria");
      setScoringAssignmentId(null);
    } finally {
      setLoadingCriteria(false);
    }
  };

  const handleScoreChange = (criteriaId: string, value: string) => {
    const num = value === "" ? 0 : parseInt(value, 10);
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criteriaId
          ? { ...c, rawScore: Number.isNaN(num) ? 0 : num }
          : c,
      ),
    );
  };

  const saveScores = async () => {
    if (!scoringAssignmentId) return;

    for (const c of criteria) {
      if (c.rawScore > c.maxScore || c.rawScore < 0) {
        toast.error(
          `Score for ${c.criteriaName} must be between 0 and ${c.maxScore}`,
        );
        return;
      }
    }

    setSavingScores(true);
    try {
      const res = await fetch("/api/dashboard/idea-rounds/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: scoringAssignmentId,
          scores: criteria.map((c) => ({
            criteriaId: c.id,
            rawScore: c.rawScore,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to save scores");

      toast.success("Scores saved successfully");
      setScoringAssignmentId(null);
      onScoresSaved();
    } catch {
      toast.error("Failed to save scores");
    } finally {
      setSavingScores(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Select
          value={trackFilter}
          onValueChange={(value) => setTrackFilter(value)}
        >
          <SelectTrigger className="h-9 w-44 text-sm font-normal">
            <SelectValue placeholder="Filter by Track" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all" className="text-sm">
              All tracks
            </SelectItem>
            {uniqueTracks.map((track) => (
              <SelectItem key={track} value={track} className="text-sm">
                {track}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={scoreFilter}
          onValueChange={(value) => setScoreFilter(value)}
        >
          <SelectTrigger className="h-9 w-44 text-sm font-normal">
            <SelectValue placeholder="Scoring Status" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all" className="text-sm">
              All Statuses
            </SelectItem>
            <SelectItem value="pending" className="text-sm">
              Pending
            </SelectItem>
            <SelectItem value="scored" className="text-sm">
              Scored
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No teams found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedAllocations.map((alloc) => (
                <TableRow key={alloc.assignmentId}>
                  <TableCell className="font-medium">
                    {alloc.teamName}
                  </TableCell>
                  <TableCell>{alloc.trackName || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{alloc.teamStage}</Badge>
                  </TableCell>
                  <TableCell>
                    {alloc.scoredCriteria > 0 ? (
                      <div className="flex items-center gap-2">
                        {alloc.scoredCriteria === alloc.totalCriteria ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Pencil className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-sm">
                          {alloc.scoredCriteria} / {alloc.totalCriteria}{" "}
                          criteria
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not started
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{alloc.totalRawScore}</span>
                    <span className="text-muted-foreground text-xs ml-1">
                      / {alloc.totalMaxScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (alloc.pptUrl) {
                            window.open(
                              alloc.pptUrl,
                              "_blank",
                              "noopener,noreferrer",
                            );
                            if (alloc.roundStatus !== "Completed") {
                              openScoreDialog(alloc.assignmentId);
                            }
                          } else {
                            toast.error("No PDF submitted");
                          }
                        }}
                        disabled={!alloc.pptUrl}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openScoreDialog(alloc.assignmentId)}
                        disabled={alloc.roundStatus === "Completed"}
                      >
                        Score
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
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
                setCurrentPage(1);
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
              Page {currentPage} of {totalPages} ({filteredAllocations.length}{" "}
              rows)
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={!!scoringAssignmentId}
        onOpenChange={(open) => !open && setScoringAssignmentId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Score {activeAllocation?.teamName}</DialogTitle>
          </DialogHeader>

          {loadingCriteria ? (
            <div className="py-8 text-center text-muted-foreground animate-pulse">
              Loading criteria...
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {criteria.map((c) => (
                <div
                  key={c.id}
                  className="grid gap-2 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {c.criteriaName}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      Max: {c.maxScore}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={c.maxScore}
                    value={c.rawScore.toString()}
                    onChange={(e) => handleScoreChange(c.id, e.target.value)}
                    className="w-full text-lg"
                  />
                </div>
              ))}

              <div className="pt-4 flex justify-between items-center border-t">
                <div className="text-lg font-semibold">
                  Total: {criteria.reduce((sum, c) => sum + c.rawScore, 0)}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    / {criteria.reduce((sum, c) => sum + c.maxScore, 0)}
                  </span>
                </div>
                <Button onClick={saveScores} disabled={savingScores}>
                  {savingScores ? "Saving..." : "Save Scores"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
