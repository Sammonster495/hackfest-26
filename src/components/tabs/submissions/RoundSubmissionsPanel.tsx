"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import type {
  RoundType,
  SubmissionItem,
  SubmissionResponse,
  TrackItem,
} from "./types";

const PAGE_SIZE = 25;

function buildSubmissionsUrl({
  round,
  offset,
  search,
  trackId,
}: {
  round: RoundType;
  offset: number;
  search: string;
  trackId: string;
}) {
  const params = new URLSearchParams({
    round,
    limit: String(PAGE_SIZE),
    cursor: String(offset),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (trackId !== "all") {
    params.set("trackId", trackId);
  }

  return `/api/dashboard/submissions?${params.toString()}`;
}

export function RoundSubmissionsPanel({
  round,
  canScore,
  onOpenPdf,
}: {
  round: RoundType;
  canScore: boolean;
  onOpenPdf: (submission: SubmissionItem) => void;
}) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [search, setSearch] = useState("");
  const [trackId, setTrackId] = useState("all");
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: TODO[DARSHAN]: is this necessary
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, trackId]);

  useEffect(() => {
    let cancelled = false;

    const fetchTracks = async () => {
      try {
        const res = await fetch("/api/tracks");
        console.log("Fetch tracks response:", res);
        if (!res.ok) {
          throw new Error("Failed to fetch tracks");
        }

        const data: TrackItem[] = await res.json();
        if (!cancelled) {
          setTracks(data);
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
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
    let cancelled = false;

    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const url = buildSubmissionsUrl({
          round,
          offset,
          search,
          trackId,
        });

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to load submissions");
        }

        const data: SubmissionResponse = await res.json();

        if (!cancelled) {
          setSubmissions(data.submissions);
          setTotalCount(data.totalCount);
          setScoreDrafts((prev) => {
            const next = { ...prev };
            for (const submission of data.submissions) {
              next[submission.teamId] =
                submission.evaluatorScore !== null
                  ? String(submission.evaluatorScore)
                  : (prev[submission.teamId] ?? "");
            }

            return next;
          });
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load submissions");
          setSubmissions([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchSubmissions();

    return () => {
      cancelled = true;
    };
  }, [round, offset, search, trackId]);

  const groupedByTrack = useMemo(() => {
    const map = new Map<string, SubmissionItem[]>();
    for (const submission of submissions) {
      const existing = map.get(submission.trackName) ?? [];
      existing.push(submission);
      map.set(submission.trackName, existing);
    }
    return Array.from(map.entries());
  }, [submissions]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSubmitScore = async (teamId: string) => {
    const value = scoreDrafts[teamId] ?? "";
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) {
      toast.error("Score must be between 0 and 10");
      return;
    }

    try {
      setSavingTeamId(teamId);
      const res = await fetch("/api/dashboard/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId, score: parsed, round }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.description || err.error || "Failed to submit score",
        );
      }

      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.teamId === teamId
            ? {
                ...submission,
                evaluatorScore: parsed,
              }
            : submission,
        ),
      );
      toast.success("Score saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit score",
      );
    } finally {
      setSavingTeamId(null);
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
          <SelectTrigger className="h-9 w-52 text-sm font-normal">
            <SelectValue placeholder="Filter track" />
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
      </div>

      <div className="text-sm text-muted-foreground">
        Total submissions: {totalCount}
      </div>

      {groupedByTrack.map(([trackName, entries]) => (
        <div key={trackName} className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted font-medium">
            {trackName}
          </div>
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[34%]">Team</TableHead>
                <TableHead className="w-[24%]">Track</TableHead>
                <TableHead className="w-[14%] text-center">PDF</TableHead>
                <TableHead className="w-[28%]">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="py-4 font-medium">
                    {submission.teamName}
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground">
                    {submission.trackName}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenPdf(submission)}
                    >
                      View PDF
                    </Button>
                  </TableCell>
                  <TableCell className="py-4">
                    {canScore ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          className="h-8 w-20"
                          value={scoreDrafts[submission.teamId] ?? ""}
                          onChange={(e) =>
                            setScoreDrafts((prev) => ({
                              ...prev,
                              [submission.teamId]: e.target.value,
                            }))
                          }
                          placeholder="0-10"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSubmitScore(submission.teamId)}
                          disabled={savingTeamId === submission.teamId}
                        >
                          Save
                        </Button>
                        {submission.evaluatorScore !== null && (
                          <span className="text-xs text-muted-foreground">
                            Current: {submission.evaluatorScore}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {submission.evaluatorScore !== null
                          ? submission.evaluatorScore
                          : "View only"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {!isLoading && submissions.length === 0 && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          No submissions found for the selected filters.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
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
