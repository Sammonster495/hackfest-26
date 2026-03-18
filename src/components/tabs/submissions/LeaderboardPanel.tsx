"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDashboardPermissions } from "~/components/dashboard/permissions-context";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
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
import type { IdeaRound, TrackItem } from "./types";

type LeaderboardRow = {
  rank: number;
  teamId: string;
  teamName: string;
  collegeName: string | null;
  trackId: string;
  trackName: string;
  rawTotalScore: number;
  normalizedTotalScore: number;
  evaluatorCount: number;
};

export function LeaderboardPanel() {
  const permissions = useDashboardPermissions();
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [rounds, setRounds] = useState<IdeaRound[]>([]);

  const [selectedRoundId, setSelectedRoundId] = useState<string>("all");
  const [trackId, setTrackId] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"normalized" | "raw" | "average">(
    "normalized",
  );

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMovingTeams, setIsMovingTeams] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [_refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    fetch("/api/tracks")
      .then((res) => res.json())
      .then((data) => setTracks(data))
      .catch(() => toast.error("Failed to load tracks"));

    fetch("/api/dashboard/idea-rounds")
      .then((res) => res.json())
      .then((data) => {
        setRounds(data);
        if (data.length > 0 && selectedRoundId === "all") {
          setSelectedRoundId(data[0].id);
        }
      })
      .catch(() => toast.error("Failed to load rounds"));
  }, []);

  useEffect(() => {
    if (selectedRoundId === "all" || !selectedRoundId) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/dashboard/idea-rounds/leaderboard?roundId=${selectedRoundId}`)
      .then((res) => res.json())
      .then((data) => {
        setRows(data.rows || []);
      })
      .catch(() => toast.error("Failed to load leaderboard"))
      .finally(() => setIsLoading(false));
  }, [selectedRoundId]);

  useEffect(() => {
    setSelectedTeamIds((prev) =>
      prev.filter((teamId) => rows.some((row) => row.teamId === teamId)),
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (trackId !== "all") {
      result = result.filter((r) => r.trackId === trackId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.teamName.toLowerCase().includes(q));
    }

    // Re-sort based on selected score display
    return [...result]
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (sortBy === "normalized") {
          scoreA = a.normalizedTotalScore;
          scoreB = b.normalizedTotalScore;
        } else if (sortBy === "raw") {
          scoreA = a.rawTotalScore;
          scoreB = b.rawTotalScore;
        } else if (sortBy === "average") {
          scoreA =
            a.evaluatorCount > 0 ? a.rawTotalScore / a.evaluatorCount : 0;
          scoreB =
            b.evaluatorCount > 0 ? b.rawTotalScore / b.evaluatorCount : 0;
        }
        return scoreB - scoreA;
      })
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [rows, trackId, search, sortBy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [trackId, search, sortBy, selectedRoundId]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedTeamIds.includes(row.teamId));

  const toggleRowSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds((prev) => {
      if (checked) return prev.includes(teamId) ? prev : [...prev, teamId];
      return prev.filter((id) => id !== teamId);
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedTeamIds([]);
      return;
    }
    setSelectedTeamIds(filteredRows.map((row) => row.teamId));
  };

  const currentRound = rounds.find((r) => r.id === selectedRoundId);
  const targetStage = currentRound?.targetStage;
  const isTerminalStage = targetStage === "SELECTED";

  let nextStage: string | null = null;
  if (targetStage === "NOT_SELECTED") {
    nextStage = "SEMI_SELECTED";
  } else if (targetStage === "SEMI_SELECTED") {
    nextStage = "SELECTED";
  }

  const handleMoveToRound2 = async () => {
    if (selectedTeamIds.length === 0 || !currentRound || !nextStage) return;

    setIsMovingTeams(true);
    try {
      const res = await fetch("/api/dashboard/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamIds: selectedTeamIds,
          currentStage: currentRound.targetStage,
          nextStage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to promote teams");

      toast.success(`Moved ${data.movedCount ?? 0} team(s) to next round`);
      setSelectedTeamIds([]);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move teams",
      );
    } finally {
      setIsMovingTeams(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by team"
            className="pl-9"
          />
        </div>

        <Select value={trackId} onValueChange={(value) => setTrackId(value)}>
          <SelectTrigger className="h-9 w-44 text-sm font-normal">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all" className="text-sm">
              All tracks
            </SelectItem>
            {tracks.map((track) => (
              <SelectItem key={track.id} value={track.id} className="text-sm">
                {track.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
          <SelectTrigger className="h-9 w-48 text-sm font-normal">
            <SelectValue placeholder="Select Round" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            {rounds.length === 0 ? (
              <SelectItem value="all" disabled>
                No rounds available
              </SelectItem>
            ) : (
              rounds.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-sm">
                  {r.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value: "normalized" | "raw" | "average") =>
            setSortBy(value)
          }
        >
          <SelectTrigger className="h-9 w-44 text-sm font-normal">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="normalized" className="text-sm">
              Sort by Z-Score
            </SelectItem>
            <SelectItem value="raw" className="text-sm">
              Sort by Raw Sum
            </SelectItem>
            <SelectItem value="average" className="text-sm">
              Sort by Average
            </SelectItem>
          </SelectContent>
        </Select>

        {permissions.isAdmin && (
          <Button
            onClick={handleMoveToRound2}
            disabled={
              isTerminalStage ||
              selectedTeamIds.length === 0 ||
              isMovingTeams ||
              isLoading
            }
          >
            {isMovingTeams
              ? "Moving..."
              : isTerminalStage
                ? "Already in last stage"
                : "Move Selected To Next Round"}
          </Button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {permissions.isAdmin && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) =>
                      toggleSelectAllVisible(checked === true)
                    }
                    aria-label="Select all teams"
                  />
                </TableHead>
              )}
              <TableHead>Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>College/University</TableHead>
              <TableHead>Track</TableHead>
              <TableHead className="text-center">Evaluators</TableHead>
              <TableHead className="text-right">Raw Total</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
              <TableHead className="text-right">Z-Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow key={row.teamId}>
                {permissions.isAdmin && (
                  <TableCell>
                    <Checkbox
                      checked={selectedTeamIds.includes(row.teamId)}
                      onCheckedChange={(checked) =>
                        toggleRowSelection(row.teamId, checked === true)
                      }
                      aria-label={`Select ${row.teamName}`}
                    />
                  </TableCell>
                )}
                <TableCell>{row.rank}</TableCell>
                <TableCell>{row.teamName}</TableCell>
                <TableCell>{row.collegeName ?? "-"}</TableCell>
                <TableCell>{row.trackName || "-"}</TableCell>
                <TableCell className="text-center">
                  {row.evaluatorCount}
                </TableCell>
                <TableCell className="text-right">
                  {row.rawTotalScore?.toFixed(0) || "0"}
                </TableCell>
                <TableCell className="text-right">
                  {row.evaluatorCount && row.evaluatorCount > 0
                    ? (row.rawTotalScore / row.evaluatorCount).toFixed(2)
                    : "0.00"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {((row.normalizedTotalScore || 0) >= 0 ? "+" : "") +
                    (row.normalizedTotalScore || 0).toFixed(3)}
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={permissions.isAdmin ? 9 : 8}
                  className="text-center text-muted-foreground py-8"
                >
                  No leaderboard entries found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredRows.length > 0 && (
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
              Page {currentPage} of {totalPages} ({filteredRows.length} rows)
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
    </div>
  );
}
