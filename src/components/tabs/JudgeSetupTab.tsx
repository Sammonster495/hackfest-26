"use client";

import { Eye, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type JudgeRound = {
  id: string;
  name: string;
  status: "Draft" | "Active" | "Completed";
};

type JudgeCriteria = {
  id: string;
  judgeRoundId: string;
  criteriaName: string;
  maxScore: number;
};

type JudgeUser = {
  id: string;
  name: string;
  username: string;
};

type TeamOption = {
  id: string;
  name: string;
};

type LeaderboardRow = {
  rank: number;
  teamId: string;
  teamName: string;
  totalRawScore: number;
  maxPossibleScore: number;
  percentage: number;
  judgeCount: number;
  scoreEntries: number;
};

type JudgeScoreDetail = {
  judgeId: string;
  judgeUserId: string;
  judgeName: string;
  judgeUsername: string;
  assignmentId: string;
  totalRawScore: number;
  totalMaxScore: number;
  criteriaScores: Array<{
    criteriaId: string;
    criteriaName: string;
    maxScore: number;
    rawScore: number;
  }>;
};

export function JudgeSetupTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isCreatingCriteria, setIsCreatingCriteria] = useState(false);
  const [isUpdatingRoundStatus, setIsUpdatingRoundStatus] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoadingScoreDetails, setIsLoadingScoreDetails] = useState(false);
  const [isScoreDetailsOpen, setIsScoreDetailsOpen] = useState(false);

  const [rounds, setRounds] = useState<JudgeRound[]>([]);
  const [criteria, setCriteria] = useState<JudgeCriteria[]>([]);
  const [judgeUsers, setJudgeUsers] = useState<JudgeUser[]>([]);
  const [allTeams, setAllTeams] = useState<TeamOption[]>([]);
  const [selectedJudgeUserId, setSelectedJudgeUserId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [selectedLeaderboardTeam, setSelectedLeaderboardTeam] =
    useState<LeaderboardRow | null>(null);
  const [judgeScoreDetails, setJudgeScoreDetails] = useState<
    JudgeScoreDetail[]
  >([]);
  const [maxPerJudge, setMaxPerJudge] = useState(0);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [showCumulativeLeaderboard, setShowCumulativeLeaderboard] =
    useState(false);

  const [newRoundName, setNewRoundName] = useState("");
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaMaxScore, setNewCriteriaMaxScore] = useState("10");

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId),
    [rounds, selectedRoundId],
  );
  const selectedJudgeUser = useMemo(
    () => judgeUsers.find((judgeUser) => judgeUser.id === selectedJudgeUserId),
    [judgeUsers, selectedJudgeUserId],
  );
  const canEditSelectedRound = selectedRound?.status === "Draft";
  const canManageAssignments = selectedRound?.status !== "Completed";

  const fetchRounds = async () => {
    const res = await fetch("/api/dashboard/judge/rounds");
    if (!res.ok) throw new Error("Failed to load judge rounds");
    const data = (await res.json()) as JudgeRound[];
    setRounds(data);
    if (data.length > 0 && !selectedRoundId) {
      setSelectedRoundId(data[0].id);
    }
  };

  const fetchCriteria = async (roundId: string) => {
    if (!roundId) {
      setCriteria([]);
      return;
    }
    const res = await fetch(
      `/api/dashboard/judge/criteria?judgeRoundId=${encodeURIComponent(roundId)}`,
    );
    if (!res.ok) throw new Error("Failed to load criteria");
    const data = (await res.json()) as JudgeCriteria[];
    setCriteria(data);
  };

  const fetchAssignments = async (roundId: string, judgeUserId?: string) => {
    if (!roundId) {
      setJudgeUsers([]);
      setAllTeams([]);
      setSelectedTeamIds([]);
      return;
    }

    const params = new URLSearchParams({ judgeRoundId: roundId });
    if (judgeUserId) {
      params.set("judgeUserId", judgeUserId);
    }

    setIsLoadingAssignments(true);
    const res = await fetch(
      `/api/dashboard/judge/assignments?${params.toString()}`,
    );
    setIsLoadingAssignments(false);

    if (!res.ok) throw new Error("Failed to load judge assignments");

    const data = (await res.json()) as {
      judgeUsers: JudgeUser[];
      teams: TeamOption[];
      assignedTeamIds: string[];
    };

    setJudgeUsers(data.judgeUsers);
    setAllTeams(data.teams);
    setSelectedTeamIds(data.assignedTeamIds || []);

    if (!selectedJudgeUserId && data.judgeUsers.length > 0) {
      setSelectedJudgeUserId(data.judgeUsers[0].id);
    }
  };

  const fetchLeaderboard = async (roundId: string, cumulative = false) => {
    if (!roundId) {
      setLeaderboardRows([]);
      setMaxPerJudge(0);
      return;
    }

    setIsLoadingLeaderboard(true);
    const params = new URLSearchParams({
      judgeRoundId: roundId,
      cumulative: cumulative ? "true" : "false",
    });
    const res = await fetch(
      `/api/dashboard/judge/leaderboard?${params.toString()}`,
    );
    setIsLoadingLeaderboard(false);

    if (!res.ok) {
      throw new Error("Failed to load leaderboard");
    }

    const data = (await res.json()) as {
      maxPerJudge: number;
      rows: LeaderboardRow[];
    };

    setMaxPerJudge(data.maxPerJudge || 0);
    setLeaderboardRows(data.rows || []);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial dashboard setup fetch
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await fetchRounds();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load judge setup",
        );
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: round selection changes should reload criteria only
  useEffect(() => {
    const run = async () => {
      try {
        await fetchCriteria(selectedRoundId);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load criteria",
        );
      }
    };
    run();
  }, [selectedRoundId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: leaderboard should refresh when round or cumulative mode changes
  useEffect(() => {
    const run = async () => {
      try {
        await fetchLeaderboard(selectedRoundId, showCumulativeLeaderboard);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load leaderboard",
        );
      }
    };
    run();
  }, [selectedRoundId, showCumulativeLeaderboard]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: dedicated assignment loader for round/judge selection
  useEffect(() => {
    const run = async () => {
      try {
        await fetchAssignments(
          selectedRoundId,
          selectedJudgeUserId || undefined,
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load judge allocations",
        );
      }
    };
    run();
  }, [selectedRoundId, selectedJudgeUserId]);

  const handleCreateRound = async () => {
    if (!newRoundName.trim()) {
      toast.error("Round name is required");
      return;
    }

    try {
      setIsCreatingRound(true);
      const res = await fetch("/api/dashboard/judge/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoundName.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to create round");
      }

      const created = (await res.json()) as JudgeRound;
      setRounds((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedRoundId(created.id);
      setNewRoundName("");
      toast.success("Judge round created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create round",
      );
    } finally {
      setIsCreatingRound(false);
    }
  };

  const handleCreateCriteria = async () => {
    if (!selectedRoundId) {
      toast.error("Select a judge round first");
      return;
    }
    if (!newCriteriaName.trim()) {
      toast.error("Criteria name is required");
      return;
    }

    const maxScore = Number(newCriteriaMaxScore);
    if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 100) {
      toast.error("Max score must be an integer between 1 and 100");
      return;
    }

    try {
      setIsCreatingCriteria(true);
      const res = await fetch("/api/dashboard/judge/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeRoundId: selectedRoundId,
          criteriaName: newCriteriaName.trim(),
          maxScore,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to create criteria");
      }

      const created = (await res.json()) as JudgeCriteria;
      setCriteria((prev) =>
        [...prev, created].sort((a, b) =>
          a.criteriaName.localeCompare(b.criteriaName),
        ),
      );
      setNewCriteriaName("");
      setNewCriteriaMaxScore("10");
      toast.success("Criteria created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create criteria",
      );
    } finally {
      setIsCreatingCriteria(false);
    }
  };

  const handleSetRoundStatus = async (
    status: "Draft" | "Active" | "Completed",
  ) => {
    if (!selectedRound) {
      toast.error("Select a judge round first");
      return;
    }

    try {
      setIsUpdatingRoundStatus(true);
      const res = await fetch("/api/dashboard/judge/rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRound.id, status }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to update round status");
      }

      const updated = (await res.json()) as JudgeRound;
      setRounds((prev) =>
        prev.map((round) => (round.id === updated.id ? updated : round)),
      );
      toast.success(`Round status changed to ${updated.status}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update round status",
      );
    } finally {
      setIsUpdatingRoundStatus(false);
    }
  };

  const toggleTeamSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds((prev) => {
      if (checked) {
        if (prev.includes(teamId)) return prev;
        return [...prev, teamId];
      }
      return prev.filter((id) => id !== teamId);
    });
  };

  const handleSaveAssignments = async () => {
    if (!selectedRoundId) {
      toast.error("Select a judge round first");
      return;
    }

    if (!selectedJudgeUserId) {
      toast.error("Select a judge user first");
      return;
    }

    try {
      setIsSavingAssignments(true);
      const res = await fetch("/api/dashboard/judge/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeRoundId: selectedRoundId,
          judgeUserId: selectedJudgeUserId,
          teamIds: selectedTeamIds,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save team allocations");
      }

      toast.success("Team allocations updated");
      setSelectedTeamIds([]);
      await fetchLeaderboard(selectedRoundId, showCumulativeLeaderboard);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save team allocations",
      );
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const handleOpenScoreDetails = async (teamRow: LeaderboardRow) => {
    if (!selectedRoundId) return;

    try {
      setIsLoadingScoreDetails(true);
      setSelectedLeaderboardTeam(teamRow);
      setIsScoreDetailsOpen(true);

      const res = await fetch(
        `/api/dashboard/judge/leaderboard/details?judgeRoundId=${encodeURIComponent(selectedRoundId)}&teamId=${encodeURIComponent(teamRow.teamId)}`,
      );

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to load judge score details");
      }

      const data = (await res.json()) as { judges: JudgeScoreDetail[] };
      setJudgeScoreDetails(data.judges || []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load judge score details",
      );
      setIsScoreDetailsOpen(false);
    } finally {
      setIsLoadingScoreDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Judge Setup</h2>
        <p className="text-muted-foreground">
          Create judge rounds and configure criteria with max point allocation.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border p-8">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading judge setup...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Create Judge Round</CardTitle>
                <CardDescription>
                  Create a round first, then add scoring criteria to it.
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newRoundName}
                  onChange={(e) => setNewRoundName(e.target.value)}
                  placeholder="Round name"
                />
                <Button onClick={handleCreateRound} disabled={isCreatingRound}>
                  {isCreatingRound ? "Creating..." : "Create Round"}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Available rounds
                </p>
                <div className="flex flex-wrap gap-2">
                  {rounds.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      No rounds yet.
                    </span>
                  ) : (
                    rounds.map((round) => (
                      <Badge key={round.id} variant="secondary">
                        {round.name} ({round.status})
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Create Criteria</CardTitle>
                <CardDescription>
                  Add criteria and max score for the selected judge round.
                </CardDescription>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Judge round</p>
                <Select
                  value={selectedRoundId}
                  onValueChange={setSelectedRoundId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a round" />
                  </SelectTrigger>
                  <SelectContent>
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRound ? (
                <div className="space-y-3 rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Round status</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRound.status === "Draft"
                        ? "Draft rounds can be edited. Lock by moving to Active."
                        : "This round is locked for criteria edits."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{selectedRound.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetRoundStatus("Draft")}
                      disabled={
                        isUpdatingRoundStatus ||
                        selectedRound.status === "Draft"
                      }
                    >
                      Draft
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetRoundStatus("Active")}
                      disabled={
                        isUpdatingRoundStatus ||
                        selectedRound.status === "Active"
                      }
                    >
                      Active
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetRoundStatus("Completed")}
                      disabled={
                        isUpdatingRoundStatus ||
                        selectedRound.status === "Completed"
                      }
                    >
                      Completed
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input
                    value={newCriteriaName}
                    onChange={(e) => setNewCriteriaName(e.target.value)}
                    placeholder="Criteria name"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newCriteriaMaxScore}
                    onChange={(e) => setNewCriteriaMaxScore(e.target.value)}
                    placeholder="Max score"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateCriteria}
                disabled={
                  isCreatingCriteria ||
                  !selectedRoundId ||
                  !canEditSelectedRound
                }
              >
                {isCreatingCriteria ? "Saving..." : "Add Criteria"}
              </Button>

              {!canEditSelectedRound && selectedRound ? (
                <p className="text-xs text-amber-600">
                  Round is locked. Switch it back to Draft to add or edit
                  criteria.
                </p>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Criteria for {selectedRound?.name || "selected round"}
                </p>
                {criteria.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No criteria added yet for this round.
                  </p>
                ) : (
                  <div className="rounded-md border">
                    {criteria.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
                      >
                        <span className="text-sm font-medium">
                          {item.criteriaName}
                        </span>
                        <Badge variant="outline">Max: {item.maxScore}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Judge Team Allocation</CardTitle>
                <CardDescription>
                  Select teams allocated to each judge user for this round.
                </CardDescription>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Judge user</p>
                <Select
                  value={selectedJudgeUserId}
                  onValueChange={setSelectedJudgeUserId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select judge user" />
                  </SelectTrigger>
                  <SelectContent>
                    {judgeUsers.map((judgeUser) => (
                      <SelectItem key={judgeUser.id} value={judgeUser.id}>
                        {judgeUser.name} ({judgeUser.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingAssignments ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading teams...
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-md border p-3">
                  {allTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No teams available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allTeams.map((team) => {
                        const checked = selectedTeamIds.includes(team.id);
                        return (
                          <div
                            key={team.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleTeamSelection(team.id, value === true)
                              }
                              disabled={!canManageAssignments}
                            />
                            <span>{team.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {selectedJudgeUser
                    ? `${selectedTeamIds.length} teams selected for ${selectedJudgeUser.name}`
                    : "Select a judge user"}
                </p>
                <Button
                  onClick={handleSaveAssignments}
                  disabled={
                    !selectedRoundId ||
                    !selectedJudgeUserId ||
                    isSavingAssignments ||
                    !canManageAssignments
                  }
                >
                  {isSavingAssignments ? "Saving..." : "Save Allocation"}
                </Button>
              </div>

              {!canManageAssignments && selectedRound ? (
                <p className="text-xs text-amber-600">
                  Round is completed. Team allocation is locked.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="mb-2">Leaderboard</CardTitle>
                <CardDescription>
                  {showCumulativeLeaderboard
                    ? "Ranking based on cumulative scores across all rounds."
                    : "Ranking for the selected round based on judge scores."}
                </CardDescription>
              </div>

              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Cumulative View</p>
                  <p className="text-xs text-muted-foreground">
                    Toggle to show total score across all rounds.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isLoadingLeaderboard ? (
                    <span className="text-xs text-muted-foreground">
                      Updating...
                    </span>
                  ) : null}
                  <Switch
                    checked={showCumulativeLeaderboard}
                    onCheckedChange={setShowCumulativeLeaderboard}
                    aria-label="Toggle cumulative leaderboard"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {showCumulativeLeaderboard
                  ? "Showing cumulative total score across all rounds"
                  : `Max score per judge for this round: ${maxPerJudge}`}
              </div>

              {leaderboardRows.length === 0 && isLoadingLeaderboard ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading leaderboard...
                </div>
              ) : leaderboardRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No leaderboard data available for this round yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Total Score</TableHead>
                        <TableHead>Max Possible</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Judges</TableHead>
                        <TableHead>Score Entries</TableHead>
                        <TableHead className="text-right">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardRows.map((row) => (
                        <TableRow key={row.teamId}>
                          <TableCell>{row.rank}</TableCell>
                          <TableCell className="font-medium">
                            {row.teamName}
                          </TableCell>
                          <TableCell>{row.totalRawScore}</TableCell>
                          <TableCell>{row.maxPossibleScore}</TableCell>
                          <TableCell>{row.percentage}%</TableCell>
                          <TableCell>{row.judgeCount}</TableCell>
                          <TableCell>{row.scoreEntries}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleOpenScoreDetails(row)}
                              aria-label={`View judge scores for ${row.teamName}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isScoreDetailsOpen} onOpenChange={setIsScoreDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Judge Score Breakdown
              {selectedLeaderboardTeam
                ? ` - ${selectedLeaderboardTeam.teamName}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              Detailed criteria-wise score given by each judge for the selected
              team.
            </DialogDescription>
          </DialogHeader>

          {isLoadingScoreDetails ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading score details...
            </div>
          ) : judgeScoreDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No judge score details found for this team.
            </p>
          ) : (
            <div className="space-y-4">
              {judgeScoreDetails.map((judgeDetail) => (
                <div
                  key={judgeDetail.assignmentId}
                  className="rounded-md border"
                >
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {judgeDetail.judgeName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{judgeDetail.judgeUsername}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {judgeDetail.totalRawScore} / {judgeDetail.totalMaxScore}
                    </Badge>
                  </div>

                  <div className="p-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Criteria</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Max</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {judgeDetail.criteriaScores.map((criterion) => (
                          <TableRow
                            key={`${judgeDetail.assignmentId}-${criterion.criteriaId}`}
                          >
                            <TableCell>{criterion.criteriaName}</TableCell>
                            <TableCell className="text-right">
                              {criterion.rawScore}
                            </TableCell>
                            <TableCell className="text-right">
                              {criterion.maxScore}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
