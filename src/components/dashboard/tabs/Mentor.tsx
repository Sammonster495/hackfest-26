"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import { Textarea } from "~/components/ui/textarea";

type MentorAllocation = {
  assignmentId: string;
  teamId: string;
  teamNo: number;
  teamName: string;
  paymentStatus: string | null;
  roundId: string;
  roundName: string;
  roundStatus: "Draft" | "Active" | "Completed";
  pptUrl: string | null;
  trackName: string | null;
  feedbackCount: number;
};

type MentorAllocationWithNumber = MentorAllocation & {
  teamNumber: number;
};

type MentorHistoryRow = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  mentorRoundId: string;
  mentorRoundName: string;
  mentorRoundStatus: "Draft" | "Active" | "Completed";
  mentorName: string;
  mentorUsername: string;
  feedback: string | null;
};

type FeedbackPayload = {
  assignmentId: string;
  roundStatus: "Draft" | "Active" | "Completed";
  feedback: string;
};

export function MentorTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [allocations, setAllocations] = useState<MentorAllocation[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedTeamNumber, setSelectedTeamNumber] = useState(1);
  const [feedbackPayload, setFeedbackPayload] =
    useState<FeedbackPayload | null>(null);
  const [teamHistory, setTeamHistory] = useState<MentorHistoryRow[]>([]);

  const roundOptions = useMemo(() => {
    const uniqueRounds = new Map<
      string,
      { id: string; name: string; status: MentorAllocation["roundStatus"] }
    >();

    for (const allocation of allocations) {
      if (!uniqueRounds.has(allocation.roundId)) {
        uniqueRounds.set(allocation.roundId, {
          id: allocation.roundId,
          name: allocation.roundName,
          status: allocation.roundStatus,
        });
      }
    }

    return Array.from(uniqueRounds.values());
  }, [allocations]);

  const teamsInSelectedRound = useMemo<MentorAllocationWithNumber[]>(() => {
    const roundAllocations = allocations.filter(
      (allocation) => allocation.roundId === selectedRoundId,
    );

    return roundAllocations.map((allocation, index) => ({
      ...allocation,
      // TODO: Replace derived teamNumber with a stable mapped team identifier from DB.
      teamNumber: allocation.teamNo,
    }));
  }, [allocations, selectedRoundId]);

  const selectedAllocation = useMemo(() => {
    return (
      teamsInSelectedRound.find(
        (allocation) => allocation.teamNumber === selectedTeamNumber,
      ) ?? null
    );
  }, [teamsInSelectedRound, selectedTeamNumber]);

  const previousRoundHistory = useMemo(() => {
    if (!selectedAllocation) return [];

    return teamHistory.filter(
      (row) =>
        row.assignmentId !== selectedAllocation.assignmentId &&
        Boolean(row.feedback?.trim()),
    );
  }, [selectedAllocation, teamHistory]);

  const fetchAllocations = async () => {
    const res = await fetch("/api/dashboard/mentor/my-allocations");
    if (!res.ok) {
      setAllocations([]);
      return;
    }

    const data = (await res.json()) as MentorAllocation[];
    setAllocations(data);
  };

  const loadTeamContext = useCallback(async (allocation: MentorAllocation) => {
    setIsLoadingFeedback(true);

    try {
      const [feedbackRes, historyRes] = await Promise.all([
        fetch(
          `/api/dashboard/mentor/feedback?assignmentId=${encodeURIComponent(allocation.assignmentId)}`,
        ),
        fetch(
          `/api/dashboard/mentor/history?teamId=${encodeURIComponent(allocation.teamId)}`,
        ),
      ]);

      if (!feedbackRes.ok) {
        const data = (await feedbackRes.json()) as { message?: string };
        throw new Error(data.message || "Failed to load feedback");
      }

      if (!historyRes.ok) {
        const data = (await historyRes.json()) as { message?: string };
        throw new Error(data.message || "Failed to load feedback history");
      }

      const feedbackData = (await feedbackRes.json()) as FeedbackPayload;
      const historyData = (await historyRes.json()) as MentorHistoryRow[];

      setFeedbackPayload(feedbackData);
      setTeamHistory(historyData);
    } finally {
      setIsLoadingFeedback(false);
    }
  }, []);

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

  useEffect(() => {
    if (roundOptions.length === 0) {
      setSelectedRoundId("");
      return;
    }

    if (!roundOptions.some((round) => round.id === selectedRoundId)) {
      setSelectedRoundId(roundOptions[0]?.id ?? "");
    }
  }, [roundOptions, selectedRoundId]);

  useEffect(() => {
    if (teamsInSelectedRound.length === 0) {
      setSelectedTeamNumber(1);
      return;
    }

    const maxTeamNumber = teamsInSelectedRound.length;
    if (selectedTeamNumber < 1 || selectedTeamNumber > maxTeamNumber) {
      setSelectedTeamNumber(1);
    }
  }, [teamsInSelectedRound, selectedTeamNumber]);

  useEffect(() => {
    const run = async () => {
      if (!selectedAllocation) {
        setFeedbackPayload(null);
        setTeamHistory([]);
        return;
      }

      try {
        await loadTeamContext(selectedAllocation);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load feedback",
        );
        setFeedbackPayload(null);
        setTeamHistory([]);
      }
    };

    run();
  }, [loadTeamContext, selectedAllocation]);

  const handleSaveFeedback = async () => {
    if (!feedbackPayload) return;

    if (!feedbackPayload.feedback.trim()) {
      toast.error("Feedback cannot be empty");
      return;
    }

    try {
      setIsSavingFeedback(true);
      const res = await fetch("/api/dashboard/mentor/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: feedbackPayload.assignmentId,
          feedback: feedbackPayload.feedback,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save feedback");
      }

      toast.success("Feedback saved");
      await fetchAllocations();

      if (selectedAllocation) {
        await loadTeamContext(selectedAllocation);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save feedback",
      );
    } finally {
      setIsSavingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mentor Feedback</h2>
        <p className="text-muted-foreground">
          Review allocated teams by round, switch using team number, and submit
          feedback in a single workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading assigned teams...
        </div>
      ) : roundOptions.length === 0 ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No teams are allocated to your mentor account yet.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(240px,340px)_minmax(0,1fr)]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Round</CardTitle>
                <CardDescription>Select which round to review.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedRoundId}
                  onValueChange={setSelectedRoundId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {roundOptions.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name} ({round.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Team IDs ({selectedTeamNumber})
                </CardTitle>
                <CardDescription>Pick a team number directly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedTeamNumber((prev) => Math.max(1, prev - 1))
                    }
                    disabled={
                      teamsInSelectedRound.length === 0 ||
                      selectedTeamNumber <= 1
                    }
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedTeamNumber((prev) =>
                        Math.min(teamsInSelectedRound.length, prev + 1),
                      )
                    }
                    disabled={
                      teamsInSelectedRound.length === 0 ||
                      selectedTeamNumber >= teamsInSelectedRound.length
                    }
                  >
                    Next
                  </Button>
                </div>

                <div className="rounded-md border p-2">
                  <div className="flex max-w-full flex-wrap gap-1">
                    {teamsInSelectedRound.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No teams in this round
                      </span>
                    ) : (
                      teamsInSelectedRound.map((team) => (
                        <Button
                          key={team.assignmentId}
                          type="button"
                          size="sm"
                          variant={
                            team.teamNumber === selectedTeamNumber
                              ? "default"
                              : "outline"
                          }
                          className="h-7 min-w-8 px-2"
                          onClick={() => setSelectedTeamNumber(team.teamNumber)}
                        >
                          {team.teamNumber}
                        </Button>
                      ))
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {selectedAllocation
                    ? `Team ${selectedAllocation.teamNumber}: ${selectedAllocation.teamName}`
                    : "No team available for selected round"}
                </p>
              </CardContent>
            </Card>
          </div>

          {!selectedAllocation ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No team available for the selected round.
            </div>
          ) : (
            <div className="grid min-h-[70vh] grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{selectedAllocation.teamName}</CardTitle>
                  <CardDescription>
                    Team {selectedAllocation.teamNumber} in{" "}
                    {selectedAllocation.roundName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedAllocation.roundStatus}
                    </Badge>
                    <Badge variant="outline">
                      {selectedAllocation.feedbackCount > 0
                        ? "Feedback Saved"
                        : "No Feedback Yet"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Your Previous Feedback For This Team
                    </p>
                    {isLoadingFeedback ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading feedback history...
                      </div>
                    ) : previousRoundHistory.length === 0 ? (
                      <div className="rounded-md border p-3 text-sm text-muted-foreground">
                        No previous round feedback from you is available.
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Round</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Feedback</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previousRoundHistory.map((row, index) => (
                              <TableRow key={`${row.assignmentId}-${index}`}>
                                <TableCell className="font-medium">
                                  {row.mentorRoundName}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {row.mentorRoundStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-85 whitespace-pre-wrap text-sm">
                                  {row.feedback}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Current Round Feedback</CardTitle>
                  <CardDescription>
                    Add or update feedback for the selected team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingFeedback ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading feedback...
                    </div>
                  ) : !feedbackPayload ? (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                      No feedback data available.
                    </div>
                  ) : (
                    <>
                      <Textarea
                        value={feedbackPayload.feedback}
                        onChange={(event) =>
                          setFeedbackPayload((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  feedback: event.target.value,
                                }
                              : prev,
                          )
                        }
                        placeholder="Write actionable feedback for this team"
                        disabled={feedbackPayload.roundStatus === "Completed"}
                        className="min-h-64"
                      />

                      {feedbackPayload.roundStatus === "Completed" ? (
                        <p className="text-xs text-amber-600">
                          Round is completed. Feedback is read-only.
                        </p>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSaveFeedback}
                            disabled={isSavingFeedback}
                          >
                            {isSavingFeedback ? "Saving..." : "Save Feedback"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
