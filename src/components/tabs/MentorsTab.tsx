"use client";

import { ChevronRight, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { promise } from "zod";
import { useDashboardUser } from "~/components/dashboard/permissions-context";
import { MentorTab } from "~/components/dashboard/tabs/Mentor";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
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
import { apiFetch } from "~/lib/fetcher";

type MentorRound = {
  id: string;
  name: string;
  status: "Draft" | "Active" | "Completed";
};

type MentorUser = {
  id: string;
  name: string;
  username: string;
};

type TeamOption = {
  id: string;
  name: string;
};

type MentorHistoryRow = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  mentorRoundId: string;
  mentorRoundName: string;
  mentorRoundStatus: "Draft" | "Active" | "Completed";
  mentorId: string;
  mentorUserId: string;
  mentorName: string;
  mentorUsername: string;
  feedbackId: string | null;
  feedback: string | null;
};

function AdminMentorPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isUpdatingRoundStatus, setIsUpdatingRoundStatus] = useState(false);
  const [isDeletingRound, setIsDeletingRound] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const [isCopyingAssignments, setIsCopyingAssignments] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [rounds, setRounds] = useState<MentorRound[]>([]);
  const [mentorUsers, setMentorUsers] = useState<MentorUser[]>([]);
  const [allTeams, setAllTeams] = useState<
    Array<{ id: string; name: string; trackId: string }>
  >([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [sourceRoundId, setSourceRoundId] = useState("");
  const [overwriteCopiedAssignments, setOverwriteCopiedAssignments] =
    useState(false);
  const [selectedMentorUserId, setSelectedMentorUserId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<MentorHistoryRow[]>(
    [],
  );
  const [historyMentorFilterId, setHistoryMentorFilterId] = useState("all");
  const [historyRoundFilterId, setHistoryRoundFilterId] = useState("all");
  const [historyTeamFilterId, setHistoryTeamFilterId] = useState("all");

  const [labs, setLabs] = useState<{ id: string; name: string }[]>([]);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [tracks, setTracks] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");

  const [teamSearch, setTeamSearch] = useState("");

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId),
    [rounds, selectedRoundId],
  );

  const selectedMentorUser = useMemo(
    () => mentorUsers.find((user) => user.id === selectedMentorUserId),
    [mentorUsers, selectedMentorUserId],
  );

  const canManageAssignments = selectedRound?.status !== "Completed";

  const filteredTeams = useMemo(() => {
    const term = teamSearch.trim().toLowerCase();
    const trackFiltered = allTeams.filter((team) =>
      selectedTrackId ? team.trackId === selectedTrackId : true,
    );

    if (!term) return trackFiltered;
    return trackFiltered.filter(
      (team) =>
        team.name.toLowerCase().includes(term) ||
        team.id.toLowerCase().includes(term),
    );
  }, [allTeams, teamSearch, selectedTrackId]);

  const historyMentorOptions = useMemo(() => {
    const unique = new Map<string, { id: string; label: string }>();
    for (const row of feedbackHistory) {
      if (!unique.has(row.mentorUserId)) {
        unique.set(row.mentorUserId, {
          id: row.mentorUserId,
          label: `${row.mentorName} (@${row.mentorUsername})`,
        });
      }
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [feedbackHistory]);

  const historyRoundOptions = useMemo(() => {
    const statusPriority: Record<MentorRound["status"], number> = {
      Active: 0,
      Draft: 1,
      Completed: 2,
    };

    const unique = new Map<
      string,
      { id: string; name: string; status: MentorRound["status"] }
    >();
    for (const row of feedbackHistory) {
      if (!unique.has(row.mentorRoundId)) {
        unique.set(row.mentorRoundId, {
          id: row.mentorRoundId,
          name: row.mentorRoundName,
          status: row.mentorRoundStatus,
        });
      }
    }

    return Array.from(unique.values()).sort((a, b) => {
      const byStatus = statusPriority[a.status] - statusPriority[b.status];
      if (byStatus !== 0) return byStatus;
      return a.name.localeCompare(b.name);
    });
  }, [feedbackHistory]);

  const historyTeamOptions = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    for (const row of feedbackHistory) {
      if (!unique.has(row.teamId)) {
        unique.set(row.teamId, {
          id: row.teamId,
          name: row.teamName,
        });
      }
    }

    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [feedbackHistory]);

  const filteredHistory = useMemo(() => {
    return feedbackHistory.filter((row) => {
      const mentorPass =
        historyMentorFilterId === "all" ||
        row.mentorUserId === historyMentorFilterId;
      const roundPass =
        historyRoundFilterId === "all" ||
        row.mentorRoundId === historyRoundFilterId;
      const teamPass =
        historyTeamFilterId === "all" || row.teamId === historyTeamFilterId;
      return mentorPass && roundPass && teamPass;
    });
  }, [
    feedbackHistory,
    historyMentorFilterId,
    historyRoundFilterId,
    historyTeamFilterId,
  ]);

  const groupedHistoryByRound = useMemo(() => {
    const statusPriority: Record<MentorRound["status"], number> = {
      Active: 0,
      Draft: 1,
      Completed: 2,
    };

    const map = new Map<
      string,
      {
        id: string;
        name: string;
        status: MentorRound["status"];
        rows: MentorHistoryRow[];
      }
    >();

    for (const row of filteredHistory) {
      const existing = map.get(row.mentorRoundId);
      if (existing) {
        existing.rows.push(row);
      } else {
        map.set(row.mentorRoundId, {
          id: row.mentorRoundId,
          name: row.mentorRoundName,
          status: row.mentorRoundStatus,
          rows: [row],
        });
      }
    }

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        rows: group.rows.sort((a, b) => a.teamName.localeCompare(b.teamName)),
      }))
      .sort((a, b) => {
        const byStatus = statusPriority[a.status] - statusPriority[b.status];
        if (byStatus !== 0) return byStatus;
        return a.name.localeCompare(b.name);
      });
  }, [filteredHistory]);

  const fetchRounds = async () => {
    const res = await fetch("/api/dashboard/mentor/rounds");
    if (!res.ok) throw new Error("Failed to load mentor rounds");
    const data = (await res.json()) as MentorRound[];
    setRounds(data);
    if (data.length > 0 && !selectedRoundId) {
      setSelectedRoundId(data[0].id);
    }
  };

  const fetchAssignments = async (roundId: string, mentorUserId?: string) => {
    if (!roundId) {
      setMentorUsers([]);
      setAllTeams([]);
      setSelectedTeamIds([]);
      return;
    }

    const params = new URLSearchParams({ mentorRoundId: roundId });
    if (mentorUserId) {
      params.set("mentorUserId", mentorUserId);
    }
    if (selectedLabId) {
      params.set("labId", selectedLabId);
    }

    setIsLoadingAssignments(true);
    const res = await fetch(
      `/api/dashboard/mentor/assignments?${params.toString()}`,
    );
    setIsLoadingAssignments(false);

    if (!res.ok) throw new Error("Failed to load mentor assignments");

    const data = (await res.json()) as {
      mentorUsers: MentorUser[];
      teams: TeamOption[];
      assignedTeamIds: string[];
    };

    setMentorUsers(data.mentorUsers);
    setAllTeams(data.teams);
    setSelectedTeamIds(data.assignedTeamIds || []);

    if (!selectedMentorUserId && data.mentorUsers.length > 0) {
      setSelectedMentorUserId(data.mentorUsers[0].id);
    }
  };

  const fetchHistory = async (roundId?: string) => {
    setIsLoadingHistory(true);
    const params = new URLSearchParams();
    if (roundId) {
      params.set("mentorRoundId", roundId);
    }

    const query = params.toString();
    const res = await fetch(
      `/api/dashboard/mentor/history${query ? `?${query}` : ""}`,
    );
    setIsLoadingHistory(false);

    if (!res.ok) throw new Error("Failed to load mentor feedback history");
    const data = (await res.json()) as MentorHistoryRow[];
    setFeedbackHistory(data);
  };

  const fetchLabs = async () => {
    const result = await apiFetch<Array<{ id: string; name: string }>>(
      "/api/dashboard/allocations?get=labs",
    );

    setLabs(result);
  };

  const fetchTracks = async () => {
    const response = await fetch("/api/tracks");
    if (!response.ok) {
      toast.error("Failed to load tracks");
      return;
    }

    const data = await response.json();
    setTracks(data as Array<{ id: string; name: string }>);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial setup fetch
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchRounds(), fetchLabs(), fetchTracks()]);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load mentor setup",
        );
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: selection-driven refresh
  useEffect(() => {
    const run = async () => {
      try {
        await fetchAssignments(
          selectedRoundId,
          selectedMentorUserId || undefined,
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load mentor assignments",
        );
      }
    };
    run();
  }, [selectedRoundId, selectedMentorUserId, selectedLabId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh history when selected round context changes
  useEffect(() => {
    const run = async () => {
      try {
        await fetchHistory();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load mentor history",
        );
      }
    };
    run();
  }, [selectedRoundId]);

  const handleCreateRound = async () => {
    const usedNumbers = new Set<number>();
    for (const round of rounds) {
      const match = /^round\s+(\d+)$/i.exec(round.name.trim());
      if (match?.[1]) {
        usedNumbers.add(Number(match[1]));
      }
    }

    let next = 1;
    while (usedNumbers.has(next)) {
      next += 1;
    }

    const finalName = `Round ${next}`;

    try {
      setIsCreatingRound(true);
      const res = await fetch("/api/dashboard/mentor/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to create round");
      }

      const created = (await res.json()) as MentorRound;
      setRounds((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedRoundId(created.id);
      toast.success("Mentor round created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create round",
      );
    } finally {
      setIsCreatingRound(false);
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!roundId) {
      return;
    }

    try {
      setIsDeletingRound(true);
      const res = await fetch(
        `/api/dashboard/mentor/rounds?id=${encodeURIComponent(roundId)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to delete round");
      }

      const nextRounds = rounds.filter((round) => round.id !== roundId);
      setRounds(nextRounds);
      if (selectedRoundId === roundId) {
        setSelectedRoundId(nextRounds[0]?.id ?? "");
      }
      setSourceRoundId("");
      setSelectedMentorUserId("");
      setSelectedTeamIds([]);
      setFeedbackHistory([]);
      toast.success("Mentor round deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete round",
      );
    } finally {
      setIsDeletingRound(false);
    }
  };

  const handleSetRoundStatus = async (
    status: "Draft" | "Active" | "Completed",
  ) => {
    if (!selectedRound) {
      toast.error("Select a mentor round first");
      return;
    }

    try {
      setIsUpdatingRoundStatus(true);
      const res = await fetch("/api/dashboard/mentor/rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRound.id, status }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to update round status");
      }

      const updated = (await res.json()) as MentorRound;
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

  const handleSelectVisibleTeams = () => {
    setSelectedTeamIds((prev) => {
      const combined = new Set(prev);
      for (const team of filteredTeams) {
        combined.add(team.id);
      }
      return Array.from(combined);
    });
  };

  const handleCopyFromPreviousRound = async () => {
    if (!selectedRoundId || !sourceRoundId) {
      toast.error("Select source and target rounds");
      return;
    }

    if (selectedRoundId === sourceRoundId) {
      toast.error("Source and target rounds must be different");
      return;
    }

    try {
      setIsCopyingAssignments(true);
      const res = await fetch("/api/dashboard/mentor/assignments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMentorRoundId: sourceRoundId,
          targetMentorRoundId: selectedRoundId,
          overwriteExisting: overwriteCopiedAssignments,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to copy assignments");
      }

      const data = (await res.json()) as { copiedCount: number };
      toast.success(`Copied ${data.copiedCount} mentor-team allocations`);
      await fetchAssignments(
        selectedRoundId,
        selectedMentorUserId || undefined,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to copy assignments",
      );
    } finally {
      setIsCopyingAssignments(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedRoundId || !selectedMentorUserId) {
      toast.error("Select both round and mentor user");
      return;
    }

    try {
      setIsSavingAssignments(true);
      const res = await fetch("/api/dashboard/mentor/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorRoundId: selectedRoundId,
          mentorUserId: selectedMentorUserId,
          teamIds: selectedTeamIds,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "Failed to save assignments");
      }

      toast.success("Mentor assignments saved");
      await fetchAssignments(selectedRoundId, selectedMentorUserId);
      await fetchHistory();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save assignments",
      );
    } finally {
      setIsSavingAssignments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading mentor setup...
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mentor Setup</h2>
        <p className="text-muted-foreground">
          Create mentor rounds, allocate mentors to teams, and review feedback
          history.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="min-w-0 border-primary/20 bg-linear-to-b from-background to-primary/5 xl:col-span-2">
          <CardContent className="space-y-4">
            <div>
              <CardTitle className="mb-2">Create Mentor Round</CardTitle>
              <CardDescription>
                Add rounds used for mentor feedback cycles.
              </CardDescription>
            </div>

            <Button
              className="w-full"
              onClick={handleCreateRound}
              disabled={isCreatingRound}
            >
              {isCreatingRound ? "Creating..." : "Add Round"}
            </Button>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Available rounds</p>
              <div className="flex flex-wrap gap-2">
                {rounds.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No rounds yet
                  </span>
                ) : (
                  rounds.map((round) => (
                    <div
                      key={round.id}
                      className="flex items-center gap-1 rounded-md border bg-background pr-1"
                    >
                      <Button
                        variant={
                          selectedRoundId === round.id ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setSelectedRoundId(round.id)}
                      >
                        {round.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => handleDeleteRound(round.id)}
                        disabled={isDeletingRound}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedRound ? (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="secondary">{selectedRound.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetRoundStatus("Draft")}
                    disabled={
                      isUpdatingRoundStatus || selectedRound.status === "Draft"
                    }
                  >
                    Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetRoundStatus("Active")}
                    disabled={
                      isUpdatingRoundStatus || selectedRound.status === "Active"
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

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Copy From Previous Round</p>
              <Select value={sourceRoundId} onValueChange={setSourceRoundId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds
                    .filter((round) => round.id !== selectedRoundId)
                    .map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between rounded-md border p-2">
                <span className="text-xs text-muted-foreground">
                  Overwrite current target assignments
                </span>
                <Switch
                  checked={overwriteCopiedAssignments}
                  onCheckedChange={setOverwriteCopiedAssignments}
                />
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleCopyFromPreviousRound}
                disabled={
                  isCopyingAssignments || !selectedRoundId || !sourceRoundId
                }
              >
                {isCopyingAssignments ? "Copying..." : "Use Same Mentors"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-primary/20 bg-linear-to-b from-background to-primary/5 xl:col-span-3">
          <CardContent className="space-y-4">
            <div>
              <CardTitle className="mb-2">Mentor Team Allocation</CardTitle>
              <CardDescription>
                Assign teams to mentors for the selected round.
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Mentor round</p>
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

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Mentor user</p>
                <Select
                  value={selectedMentorUserId}
                  onValueChange={setSelectedMentorUserId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mentor user" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorUsers.map((mentorUser) => (
                      <SelectItem key={mentorUser.id} value={mentorUser.id}>
                        {mentorUser.name} ({mentorUser.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Lab</p>
                <Select value={selectedLabId} onValueChange={setSelectedLabId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Track</p>
                <Select
                  value={selectedTrackId}
                  onValueChange={setSelectedTrackId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingAssignments ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading teams...
              </div>
            ) : (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Input
                    placeholder="Search teams by name or ID"
                    value={teamSearch}
                    onChange={(event) => setTeamSearch(event.target.value)}
                    className="md:col-span-2"
                  />
                  <div className="grid min-w-0 grid-cols-2 gap-2 overflow-hidden">
                    <Button
                      variant="outline"
                      className="w-full min-w-0"
                      onClick={() => setSelectedTeamIds([])}
                      disabled={!canManageAssignments}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full min-w-0"
                      onClick={handleSelectVisibleTeams}
                      disabled={
                        filteredTeams.length === 0 || !canManageAssignments
                      }
                    >
                      Select Visible
                    </Button>
                  </div>
                </div>

                <div className="h-72 overflow-x-hidden overflow-y-scroll rounded-md border p-3 pr-2">
                  {allTeams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No teams available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredTeams.map((team) => {
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
                            <span className="truncate">{team.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selectedMentorUser
                  ? `${selectedTeamIds.length} teams selected for ${selectedMentorUser.name}`
                  : "Select a mentor user"}
              </p>
              <Button
                onClick={handleSaveAssignments}
                disabled={
                  !selectedRoundId ||
                  !selectedMentorUserId ||
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
      </div>

      <Card className="min-w-0 border-primary/20 bg-linear-to-b from-background to-primary/5">
        <CardContent className="space-y-3">
          <div>
            <CardTitle className="mb-2">Mentor Feedback History</CardTitle>
            <CardDescription>
              Review mentor feedback records by mentor and round.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Mentor</p>
              <Select
                value={historyMentorFilterId}
                onValueChange={setHistoryMentorFilterId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by mentor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All mentors</SelectItem>
                  {historyMentorOptions.map((mentorOption) => (
                    <SelectItem key={mentorOption.id} value={mentorOption.id}>
                      {mentorOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Team</p>
              <Select
                value={historyTeamFilterId}
                onValueChange={setHistoryTeamFilterId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teams</SelectItem>
                  {historyTeamOptions.map((teamOption) => (
                    <SelectItem key={teamOption.id} value={teamOption.id}>
                      {teamOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Round</p>
              <Select
                value={historyRoundFilterId}
                onValueChange={setHistoryRoundFilterId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rounds</SelectItem>
                  {historyRoundOptions.map((roundOption) => (
                    <SelectItem key={roundOption.id} value={roundOption.id}>
                      {roundOption.name} ({roundOption.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading feedback history...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No mentor feedback matches the selected filters.
            </div>
          ) : (
            <div className="space-y-3">
              {groupedHistoryByRound.map((group) => (
                <details
                  key={group.id}
                  open
                  className="group overflow-hidden rounded-md border"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                      <span className="font-medium">{group.name}</span>
                      <Badge variant="secondary">{group.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {group.rows.length} entr
                      {group.rows.length > 1 ? "ies" : "y"}
                    </span>
                  </summary>

                  <div className="overflow-x-auto border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.rows.map((row, index) => (
                          <TableRow key={`${row.assignmentId}-${index}`}>
                            <TableCell>
                              {row.mentorName} @{row.mentorUsername}
                            </TableCell>
                            <TableCell>{row.teamName}</TableCell>
                            <TableCell className="max-w-105 truncate">
                              {row.feedback?.trim() || "No feedback submitted"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MentorsTab() {
  const dashboardUser = useDashboardUser();
  const roleNames = dashboardUser.roles.map((role) => role.name);

  if (roleNames.includes("ADMIN")) {
    return <AdminMentorPanel />;
  }

  if (roleNames.includes("MENTOR")) {
    return <MentorTab />;
  }

  return (
    <div className="rounded-md border p-4 text-sm text-muted-foreground">
      You do not have access to mentor features.
    </div>
  );
}
