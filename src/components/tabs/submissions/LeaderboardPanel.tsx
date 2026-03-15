"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
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
import type { LeaderboardItem, LeaderboardResponse, TrackItem } from "./types";

const PAGE_SIZE = 25;

function buildLeaderboardUrl({
  offset,
  search,
  trackId,
  round,
  scoreType,
  refreshKey,
}: {
  offset: number;
  search: string;
  trackId: string;
  round: "all" | "ROUND_1" | "ROUND_2";
  scoreType: "average" | "sum" | "normalized";
  refreshKey: number;
}) {
  const params = new URLSearchParams({
    cursor: String(offset),
    limit: String(PAGE_SIZE),
    round,
    scoreType,
    refresh: String(refreshKey),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (trackId !== "all") {
    params.set("trackId", trackId);
  }

  return `/api/dashboard/leaderboard?${params.toString()}`;
}

export function LeaderboardPanel() {
  const permissions = useDashboardPermissions();
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [rows, setRows] = useState<LeaderboardItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [trackId, setTrackId] = useState("all");
  const [round, setRound] = useState<"all" | "ROUND_1" | "ROUND_2">("all");
  const [scoreType, setScoreType] = useState<"average" | "sum" | "normalized">(
    "average",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMovingTeams, setIsMovingTeams] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchTracks = async () => {
      try {
        const res = await fetch("/api/tracks");
        if (!res.ok) {
          throw new Error("Failed to fetch tracks");
        }

        const data: TrackItem[] = await res.json();
        if (!cancelled) {
          setTracks(data);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load tracks");
        }
      }
    };

    void fetchTracks();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedTeamIds((prev) =>
      prev.filter((teamId) => rows.some((row) => row.teamId === teamId)),
    );
  }, [rows]);

  useEffect(() => {
    let cancelled = false;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          buildLeaderboardUrl({
            offset,
            search,
            trackId,
            round,
            scoreType,
            refreshKey,
          }),
        );

        if (!res.ok) {
          throw new Error("Failed to fetch leaderboard");
        }

        const data: LeaderboardResponse = await res.json();
        if (!cancelled) {
          setRows(data.leaderboard);
          setTotalCount(data.totalCount);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load leaderboard");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [offset, search, trackId, round, scoreType, refreshKey]);

  const allVisibleSelected =
    rows.length > 0 &&
    rows.every((row) => selectedTeamIds.includes(row.teamId));

  const toggleRowSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds((prev) => {
      if (checked) {
        return prev.includes(teamId) ? prev : [...prev, teamId];
      }
      return prev.filter((id) => id !== teamId);
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedTeamIds([]);
      return;
    }
    setSelectedTeamIds(rows.map((row) => row.teamId));
  };

  const handleMoveToRound2 = async () => {
    if (selectedTeamIds.length === 0) return;

    setIsMovingTeams(true);
    try {
      const res = await fetch("/api/dashboard/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamIds: selectedTeamIds }),
      });

      const data = (await res.json()) as {
        movedCount?: number;
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message || "Failed to move teams to Round 2");
      }

      toast.success(`Moved ${data.movedCount ?? 0} team(s) to Round 2`);
      setSelectedTeamIds([]);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to move teams to Round 2",
      );
    } finally {
      setIsMovingTeams(false);
    }
  };

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

        <Select
          value={round}
          onValueChange={(value: "all" | "ROUND_1" | "ROUND_2") =>
            setRound(value)
          }
        >
          <SelectTrigger className="h-9 w-40 text-sm font-normal">
            <SelectValue placeholder="Round" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all" className="text-sm">
              All rounds
            </SelectItem>
            <SelectItem value="ROUND_1" className="text-sm">
              Round 1
            </SelectItem>
            <SelectItem value="ROUND_2" className="text-sm">
              Round 2
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={scoreType}
          onValueChange={(value: "average" | "sum" | "normalized") =>
            setScoreType(value)
          }
        >
          <SelectTrigger className="h-9 w-44 text-sm font-normal">
            <SelectValue placeholder="Score type" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="average" className="text-sm">
              Average
            </SelectItem>
            <SelectItem value="sum" className="text-sm">
              Sum
            </SelectItem>
            <SelectItem value="normalized" className="text-sm">
              Normalized (fair)
            </SelectItem>
          </SelectContent>
        </Select>

        {permissions.isAdmin && (
          <Button
            onClick={handleMoveToRound2}
            disabled={
              selectedTeamIds.length === 0 || isMovingTeams || isLoading
            }
          >
            {isMovingTeams ? "Moving..." : "Move Selected To Round 2"}
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
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
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
                <TableCell>{row.trackName}</TableCell>
                <TableCell>
                  {scoreType === "normalized"
                    ? (row.score >= 0 ? "+" : "") + row.score.toFixed(3)
                    : row.score.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={permissions.isAdmin ? 6 : 5}
                  className="text-center text-muted-foreground py-8"
                >
                  No leaderboard entries found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
            disabled={offset === 0 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= totalCount || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
