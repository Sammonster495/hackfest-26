"use client";

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addOrganizerTeamMember,
  createOrganizerEventTeam,
  deleteOrganizerEventTeam,
  getOrganizerAvailableParticipants,
  getOrganizerEventStats,
  getOrganizerEventTeams,
  getOrganizerTeamMembers,
  type OrganizerEventStat,
  type OrganizerEventTeam,
  type ParticipantOption,
  setOrganizerTeamLeader,
  type TeamMemberOption,
  updateOrganizerEventTeam,
} from "~/components/dashboard/events/request";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
};

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function getStatusClasses(status: OrganizerEventStat["eventStatus"]) {
  switch (status) {
    case "Published":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Ongoing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Completed":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export function EventStatsTab() {
  const [eventStats, setEventStats] = useState<OrganizerEventStat[]>([]);
  const [teams, setTeams] = useState<OrganizerEventTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [newTeamName, setNewTeamName] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [_memberActionTeamId, setMemberActionTeamId] = useState<string | null>(
    null,
  );
  const [_confirmingTeamId, setConfirmingTeamId] = useState<string | null>(
    null,
  );
  const [addMemberPopoverTeamId, setAddMemberPopoverTeamId] = useState<
    string | null
  >(null);
  const [setLeaderPopoverTeamId, setSetLeaderPopoverTeamId] = useState<
    string | null
  >(null);
  const [addMemberQuery, setAddMemberQuery] = useState("");
  const [leaderQuery, setLeaderQuery] = useState("");
  const [_addMemberOptions, setAddMemberOptions] = useState<
    ParticipantOption[]
  >([]);
  const [_leaderOptions, setLeaderOptions] = useState<TeamMemberOption[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [viewTeamId, setViewTeamId] = useState<string | null>(null);
  const [viewTeamMembers, setViewTeamMembers] = useState<TeamMemberOption[]>(
    [],
  );
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState<
    "all" | "confirmed" | "unconfirmed"
  >("all");
  const [exportFields, setExportFields] = useState<Record<string, boolean>>({
    teamName: true,
    isComplete: true,
    paymentStatus: true,
    attended: true,
    leaderName: true,
    leaderEmail: true,
    leaderPhone: true,
    leaderCollege: true,
    memberNames: true,
    memberEmails: true,
    memberPhones: true,
    colleges: true,
  });

  const EXPORT_FIELD_LABELS: Record<string, string> = {
    teamName: "Team Name",
    isComplete: "Is Complete",
    paymentStatus: "Payment Status",
    attended: "Attended",
    leaderName: "Leader Name",
    leaderEmail: "Leader Email",
    leaderPhone: "Leader Phone",
    leaderCollege: "Leader College",
    memberNames: "Member Names",
    memberEmails: "Member Emails",
    memberPhones: "Member Phones",
    colleges: "All Member Colleges",
  };

  const activeEventId = selectedEventId || eventStats[0]?.eventId || "";

  const selectedEvent = useMemo(
    () => eventStats.find((event) => event.eventId === activeEventId) ?? null,
    [eventStats, activeEventId],
  );

  const filteredTeams = useMemo(() => {
    const query = teamSearchQuery.trim().toLowerCase();
    if (!query) return teams;

    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [teams, teamSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / pageSize));
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const loadStats = useCallback(async () => {
    setLoading(true);
    const stats = await getOrganizerEventStats();
    setEventStats(stats);

    if (stats.length === 0) {
      setSelectedEventId("");
      setTeams([]);
      setLoading(false);
      return;
    }

    setSelectedEventId((current) => {
      if (current && stats.some((event) => event.eventId === current)) {
        return current;
      }
      return stats[0]?.eventId ?? "";
    });
    setLoading(false);
  }, []);

  const loadTeams = useCallback(async (eventId: string) => {
    if (!eventId) {
      setTeams([]);
      return;
    }

    setTeamsLoading(true);
    const data = await getOrganizerEventTeams(eventId);
    setTeams(data);
    setTeamsLoading(false);
  }, []);

  async function refreshCurrentEvent() {
    await loadStats();
    if (selectedEventId) {
      await loadTeams(selectedEventId);
    }
  }

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!selectedEventId) {
      setTeams([]);
      setAddMemberPopoverTeamId(null);
      setSetLeaderPopoverTeamId(null);
      setAddMemberQuery("");
      setLeaderQuery("");
      setAddMemberOptions([]);
      setLeaderOptions([]);
      return;
    }

    void loadTeams(selectedEventId);
    setAddMemberPopoverTeamId(null);
    setSetLeaderPopoverTeamId(null);
    setAddMemberQuery("");
    setLeaderQuery("");
    setAddMemberOptions([]);
    setLeaderOptions([]);
  }, [selectedEventId, loadTeams]);

  useEffect(() => {
    if (!selectedEventId || !addMemberPopoverTeamId) {
      setAddMemberOptions([]);
      return;
    }

    const query = addMemberQuery.trim();

    const timeoutId = setTimeout(() => {
      void getOrganizerAvailableParticipants(selectedEventId, query).then(
        setAddMemberOptions,
      );
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [selectedEventId, addMemberPopoverTeamId, addMemberQuery]);

  useEffect(() => {
    if (!selectedEventId || !setLeaderPopoverTeamId) {
      setLeaderOptions([]);
      return;
    }

    const query = leaderQuery.trim();

    const _timeoutId = setTimeout(() => {
      void getOrganizerTeamMembers(
        selectedEventId,
        setLeaderPopoverTeamId,
        query,
      ).then(setLeaderOptions);
    }, 250);
  }, [selectedEventId, setLeaderPopoverTeamId, leaderQuery]);

  const handleDownload = async () => {
    if (!selectedEventId) return;
    setIsExporting(true);
    try {
      const activeFields = Object.entries(exportFields)
        .filter(([_, checked]) => checked)
        .map(([id]) => id);

      if (activeFields.length === 0) {
        toast.error("Please select at least one field to export");
        return;
      }

      const res = await fetch("/api/dashboard/events/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          filter: exportFilter,
          fields: activeFields,
        }),
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event_teams_export_${exportFilter}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download generated successfully");
      setIsExportDialogOpen(false);
    } catch (_error) {
      toast.error("Failed to generate export");
    } finally {
      setIsExporting(false);
    }
  };

  async function handleRowClick(team: OrganizerEventTeam) {
    if (
      editingTeamId === team.id ||
      deletingTeamId === team.id ||
      updatingTeamId === team.id
    )
      return;
    setViewTeamId(team.id);
    setLoadingMembers(true);
    setViewTeamMembers([]);
    if (selectedEventId) {
      const members = await getOrganizerTeamMembers(
        selectedEventId,
        team.id,
        "",
      );
      setViewTeamMembers(members);
    }
    setLoadingMembers(false);
  }

  async function handleCreateTeam() {
    if (!activeEventId) return;
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name.");
      return;
    }

    setCreating(true);
    const created = await createOrganizerEventTeam(activeEventId, newTeamName);
    setCreating(false);

    if (!created) return;

    setNewTeamName("");
    await refreshCurrentEvent();
  }

  async function handleSaveTeam(teamId: string) {
    if (!selectedEventId || !editingName.trim()) return;

    setUpdatingTeamId(teamId);
    const updated = await updateOrganizerEventTeam(selectedEventId, teamId, {
      name: editingName.trim(),
    });
    setUpdatingTeamId(null);

    if (!updated) return;

    setEditingTeamId(null);
    setEditingName("");
    await refreshCurrentEvent();
  }

  async function _handleDeleteTeam(teamId: string) {
    if (!selectedEventId) return;

    setDeletingTeamId(teamId);
    const ok = await deleteOrganizerEventTeam(selectedEventId, teamId);
    setDeletingTeamId(null);

    if (!ok) return;

    await refreshCurrentEvent();
  }

  async function _handleAddMember(
    team: OrganizerEventTeam,
    participantId: string,
  ) {
    if (!selectedEventId) return;
    if (!participantId) {
      toast.error("Please select a participant.");
      return;
    }

    setMemberActionTeamId(team.id);
    const ok = await addOrganizerTeamMember(
      selectedEventId,
      team.id,
      participantId,
    );
    setMemberActionTeamId(null);

    if (!ok) return;

    setAddMemberPopoverTeamId(null);
    setAddMemberQuery("");
    setAddMemberOptions([]);
    await refreshCurrentEvent();
  }

  async function _handleAssignLeader(
    team: OrganizerEventTeam,
    participantId: string,
  ) {
    if (!selectedEventId) return;
    if (!participantId) {
      toast.error("Please select a leader.");
      return;
    }

    setMemberActionTeamId(team.id);
    const ok = await setOrganizerTeamLeader(
      selectedEventId,
      team.id,
      participantId,
    );
    setMemberActionTeamId(null);

    if (!ok) return;

    setSetLeaderPopoverTeamId(null);
    setLeaderQuery("");
    setLeaderOptions([]);
    await refreshCurrentEvent();
  }

  function _participantLabel(option: ParticipantOption | TeamMemberOption) {
    if (option.name && option.email) return `${option.name} (${option.email})`;
    return option.name || option.email || "Unknown participant";
  }

  async function _handleToggleConfirm(team: OrganizerEventTeam) {
    if (!selectedEventId) return;

    setConfirmingTeamId(team.id);
    const updated = await updateOrganizerEventTeam(selectedEventId, team.id, {
      isComplete: !team.isComplete,
    });
    setConfirmingTeamId(null);

    if (!updated) return;

    await refreshCurrentEvent();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Event Stats</h2>
        <p className="text-muted-foreground">
          Stats and team management for your accessible events
        </p>
      </div>

      {eventStats.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No accessible events found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div>
                  <Select
                    value={activeEventId}
                    onValueChange={setSelectedEventId}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventStats.map((event) => (
                        <SelectItem key={event.eventId} value={event.eventId}>
                          {event.eventTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedEvent && (
                  <div className="flex items-center">
                    <div
                      className={`rounded-md border px-4 py-2 text-sm font-semibold ${getStatusClasses(selectedEvent.eventStatus)}`}
                    >
                      Status: {selectedEvent.eventStatus}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedEvent && (
            <div
              className={`grid gap-4 ${selectedEvent.eventType === "Solo" ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}
            >
              <StatCard
                title={
                  selectedEvent.eventType === "Solo"
                    ? "Total Users Registered"
                    : "Registered Users"
                }
                value={selectedEvent.registeredUsers}
                description={
                  selectedEvent.eventType === "Solo"
                    ? "Total users registered in this event"
                    : "Total users registered in this event"
                }
                icon={<Users className="h-4 w-4" />}
              />
              {selectedEvent.eventType !== "Solo" ? (
                <>
                  <StatCard
                    title="Confirmed Users"
                    value={selectedEvent.confirmedUsers}
                    description="Users in completed teams"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                  <StatCard
                    title="Total Teams Registered"
                    value={selectedEvent.totalTeams}
                    description="Total teams created in this event"
                    icon={<Users className="h-4 w-4" />}
                  />
                  <StatCard
                    title="Total Teams Confirmed"
                    value={selectedEvent.confirmedTeams}
                    description="Teams marked as complete"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                </>
              ) : (
                <StatCard
                  title="Total Users Confirmed"
                  value={selectedEvent.confirmedUsers}
                  description="Users marked as confirmed"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Team CRUD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_1fr] lg:items-center">
                <Input
                  value={newTeamName}
                  onChange={(event) => setNewTeamName(event.target.value)}
                  placeholder="Create new team"
                />
                <Button
                  onClick={handleCreateTeam}
                  disabled={!activeEventId || creating}
                >
                  {creating ? "Creating..." : "Create Team"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsExportDialogOpen(true)}
                  disabled={teams.length === 0}
                  className="gap-2 border-primary/20 hover:border-primary/50"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
                <Input
                  value={teamSearchQuery}
                  onChange={(event) => setTeamSearchQuery(event.target.value)}
                  placeholder="Search existing teams"
                />
              </div>

              {teamsLoading ? (
                <div className="text-sm text-muted-foreground py-6">
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">
                  No teams found for this event.
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">
                  No teams match your search.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Team Name</TableHead>
                      <TableHead className="w-[100px]">Members</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right w-[100px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTeams.map((team) => {
                      const isEditing = editingTeamId === team.id;

                      return (
                        <TableRow
                          key={team.id}
                          onClick={() =>
                            !isEditing && void handleRowClick(team)
                          }
                          className={
                            isEditing
                              ? ""
                              : "cursor-pointer hover:bg-muted/50 transition-colors"
                          }
                        >
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 py-1"
                                autoFocus
                              />
                            ) : (
                              <span className="font-medium text-sm">
                                {team.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {team.memberCount}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-sm">
                            {team.leaderName || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
                            {team.leaderCollegeName || "-"}
                          </TableCell>
                          <TableCell>
                            {team.isComplete ? (
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[10px] font-bold uppercase">
                                Complete
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 text-[10px] font-bold uppercase"
                              >
                                Draft
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => void handleSaveTeam(team.id)}
                                    disabled={
                                      !editingName.trim() ||
                                      updatingTeamId === team.id
                                    }
                                  >
                                    {updatingTeamId === team.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingTeamId(null);
                                      setEditingName("");
                                    }}
                                    disabled={updatingTeamId === team.id}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTeamId(team.id);
                                    setEditingName(team.name);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {filteredTeams.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
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
                      Page {currentPage} of {totalPages} ({filteredTeams.length}{" "}
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
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={!!viewTeamId}
        onOpenChange={(open) => !open && setViewTeamId(null)}
      >
        <DialogContent className="sm:max-w-5xl w-[60vw] max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Team Details</DialogTitle>
          </DialogHeader>

          {loadingMembers ? (
            <div className="py-8 text-center text-muted-foreground animate-pulse">
              Loading members...
            </div>
          ) : viewTeamMembers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No members found for this team.
            </div>
          ) : (
            <div className="py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Gender</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewTeamMembers.map((member) => (
                    <TableRow key={member.participantId}>
                      <TableCell>
                        {member.isLeader ? (
                          <Badge variant="default" className="text-xs">
                            Leader
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Member
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {member.name || "-"}
                      </TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>{member.collegeName || "-"}</TableCell>
                      <TableCell className="capitalize">
                        {member.gender?.toLowerCase() || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Options
            </DialogTitle>
            <DialogDescription>
              Select which teams and data you want to include in the CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Selection
              </Label>
              <Select
                value={exportFilter}
                onValueChange={(v) =>
                  setExportFilter(v as "all" | "confirmed" | "unconfirmed")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="confirmed">
                    Confirmed Teams Only
                  </SelectItem>
                  <SelectItem value="unconfirmed">
                    Unconfirmed (Draft) Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  Fields to include
                </Label>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => {
                    const allSelected =
                      Object.values(exportFields).every(Boolean);
                    const newFields = { ...exportFields };
                    for (const key in newFields) {
                      newFields[key] = !allSelected;
                    }
                    setExportFields(newFields);
                  }}
                >
                  {Object.values(exportFields).every(Boolean)
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(EXPORT_FIELD_LABELS).map(([id, label]) => (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${id}`}
                      checked={exportFields[id]}
                      onCheckedChange={(checked) =>
                        setExportFields((prev) => ({
                          ...prev,
                          [id]: !!checked,
                        }))
                      }
                    />
                    <label
                      htmlFor={`field-${id}`}
                      className="text-xs font-medium leading-none cursor-pointer hover:text-primary transition-colors pr-1"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleDownload()}
              disabled={
                isExporting || !Object.values(exportFields).some(Boolean)
              }
              className="gap-2 min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download CSV
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
