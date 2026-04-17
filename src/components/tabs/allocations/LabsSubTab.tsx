"use client";

import {
  AlertTriangle,
  CheckCircle,
  Download,
  Loader2,
  Lock,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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

type Lab = {
  id: string;
  name: string;
  capacity: number;
  teamCount: number;
};

type LabTeam = {
  teamId: string;
  teamName: string;
  teamNo: number | null;
  collegeName: string | null;
  trackName: string | null;
  memberCount: number;
  members: { id: string; name: string | null; gender: string | null }[];
};

type AllocationTeam = {
  teamId: string;
  teamName: string;
  teamNo: number | null;
  collegeName: string | null;
  collegeId: string | null;
  trackId: string | null;
  trackName: string | null;
  memberCount: number;
  assignedLabId: string | null;
  assignedLabName: string | null;
};

export function LabsSubTab() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [teams, setTeams] = useState<AllocationTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("unassigned");

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [expandedLab, setExpandedLab] = useState<string | null>(null);
  const [labTeamDetails, setLabTeamDetails] = useState<
    Record<string, LabTeam[]>
  >({});

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<AllocationTeam | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const [locked, setLocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("labs-locked") === "true";
  });

  const toggleLocked = (val: boolean) => {
    setLocked(val);
    localStorage.setItem("labs-locked", String(val));
  };

  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [autoResult, setAutoResult] = useState<{
    assigned: number;
    notAssigned: number;
  } | null>(null);
  const [autoResultOpen, setAutoResultOpen] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/dashboard/allocations/labs/export", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hackfest_labs_allocation.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export downloaded successfully");
    } catch (_err) {
      toast.error("Failed to export labs data");
    } finally {
      setIsExporting(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: needed
  useEffect(() => {
    if (labs.length === 0 && teams.length === 0) {
      setIsLoading(true);
    }
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/dashboard/allocations/labs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLabs(data.labs ?? []);
        setTeams(data.teams ?? []);

        setExpandedLab((currentExpanded) => {
          if (currentExpanded) {
            fetch(`/api/dashboard/allocations/labs/${currentExpanded}`)
              .then((r) => r.json())
              .then((data) => {
                setLabTeamDetails((prev) => ({
                  ...prev,
                  [currentExpanded]: data.teams ?? [],
                }));
              });
          }
          return currentExpanded;
        });
      })
      .catch(() => toast.error("Failed to load lab data"))
      .finally(() => setIsLoading(false));
  }, [refreshKey, statusFilter]);

  const uniqueTracks = useMemo(() => {
    const s = new Map<string, string>();
    for (const t of teams)
      if (t.trackId && t.trackName) s.set(t.trackId, t.trackName);
    return Array.from(s.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [teams]);

  const uniqueColleges = useMemo(() => {
    const s = new Map<string, string>();
    for (const t of teams)
      if (t.collegeId && t.collegeName) s.set(t.collegeId, t.collegeName);
    return Array.from(s.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [teams]);

  const filteredTeams = useMemo(() => {
    let result = teams;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.teamName.toLowerCase().includes(q));
    }
    if (trackFilter !== "all")
      result = result.filter((t) => t.trackId === trackFilter);
    if (collegeFilter !== "all")
      result = result.filter((t) => t.collegeId === collegeFilter);
    return result;
  }, [teams, search, trackFilter, collegeFilter]);

  const hasActiveFilters =
    search.trim() || trackFilter !== "all" || collegeFilter !== "all";

  const totalAssigned = labs.reduce((s, l) => s + l.teamCount, 0);
  const totalCapacity = labs.reduce((s, l) => s + l.capacity, 0);
  const totalUnassigned = teams.filter((t) => !t.assignedLabId).length;

  const handleCreate = async () => {
    const cap = Number.parseInt(newCapacity, 10);
    if (!newName.trim() || Number.isNaN(cap) || cap <= 0) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/dashboard/allocations/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), capacity: cap }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to create lab");
      toast.success(`Lab "${newName}" created`);
      setCreateOpen(false);
      setNewName("");
      setNewCapacity("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create lab");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/dashboard/allocations/labs/${deleteTargetId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Lab deleted");
      setDeleteTargetId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lab");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExpandLab = async (labId: string) => {
    if (expandedLab === labId) {
      setExpandedLab(null);
      return;
    }
    setExpandedLab(labId);
    if (!labTeamDetails[labId]) {
      const res = await fetch(`/api/dashboard/allocations/labs/${labId}`);
      const data = await res.json();
      setLabTeamDetails((prev) => ({ ...prev, [labId]: data.teams ?? [] }));
    }
  };

  const handleOpenAssign = (team: AllocationTeam) => {
    setSelectedTeam(team);
    setAssignOpen(true);
  };

  const handleAssign = async (labId: string) => {
    if (!selectedTeam) return;
    setAssigning(labId);
    try {
      const res = await fetch(`/api/dashboard/allocations/labs/${labId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.teamId, action: "assign" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`${selectedTeam.teamName} assigned to lab`);
      const labName = labs.find((l) => l.id === labId)?.name ?? null;
      setSelectedTeam((prev) =>
        prev
          ? { ...prev, assignedLabId: labId, assignedLabName: labName }
          : prev,
      );
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async () => {
    if (!selectedTeam?.assignedLabId) return;
    setAssigning("unassign");
    try {
      const res = await fetch(
        `/api/dashboard/allocations/labs/${selectedTeam.assignedLabId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: selectedTeam.teamId,
            action: "unassign",
          }),
        },
      );
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`${selectedTeam.teamName} unassigned`);
      setSelectedTeam((prev) =>
        prev ? { ...prev, assignedLabId: null, assignedLabName: null } : prev,
      );
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unassign");
    } finally {
      setAssigning(null);
    }
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const res = await fetch("/api/dashboard/allocations/labs/auto-assign", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-assign failed");
      setAutoResult(data);
      setAutoResultOpen(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auto-assign failed");
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTrackFilter("all");
    setCollegeFilter("all");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-sm">
            Assign selected teams to labs based on capacity
          </p>
          {locked && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="h-3 w-3" /> View only
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoAssign}
            disabled={locked || isAutoAssigning || labs.length === 0}
          >
            {isAutoAssigning ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Auto-Assign
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Export
          </Button>
          <Button
            size="sm"
            disabled={locked}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Lab
          </Button>
          <Button
            variant={locked ? "default" : "outline"}
            size="sm"
            onClick={() => toggleLocked(!locked)}
            className={
              locked
                ? "bg-amber-500 hover:bg-amber-600 text-white border-0"
                : ""
            }
          >
            {locked ? (
              <Unlock className="h-4 w-4 mr-1" />
            ) : (
              <Lock className="h-4 w-4 mr-1" />
            )}
            {locked ? "Unlock" : "Lock"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground mt-1">teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalAssigned}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {totalCapacity} slots used
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {totalUnassigned}
            </div>
            <p className="text-xs text-muted-foreground mt-1">teams pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Labs panel */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-sm">Labs ({labs.length})</h3>
          {labs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
              No labs yet. Click "Add Lab" to get started.
            </div>
          ) : (
            labs.map((l) => {
              const pct =
                l.capacity > 0
                  ? Math.round((l.teamCount / l.capacity) * 100)
                  : 0;
              const full = l.teamCount >= l.capacity;
              return (
                <div key={l.id} className="rounded-lg border">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleExpandLab(l.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleExpandLab(l.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{l.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.teamCount} / {l.capacity} teams
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${full ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300" : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300"}`}
                      >
                        {pct}%
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={locked || l.teamCount > 0}
                        title={
                          locked
                            ? "Unlock to delete"
                            : l.teamCount > 0
                              ? `Reassign ${l.teamCount} team(s) before deleting`
                              : "Delete lab"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(l.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="px-4 pb-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${full ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {expandedLab === l.id && (
                    <div className="border-t px-4 pb-3 pt-2">
                      {!labTeamDetails[l.id] ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </div>
                      ) : labTeamDetails[l.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">
                          No teams assigned yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {labTeamDetails[l.id].map((t) => (
                            <div key={t.teamId} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold">
                                    {t.teamNo ? `${t.teamNo}. ` : ""}
                                    {t.teamName}
                                  </span>
                                  {t.trackName && (
                                    <span className="text-muted-foreground ml-1.5">
                                      · {t.trackName}
                                    </span>
                                  )}
                                </div>
                                <span className="text-muted-foreground">
                                  {t.memberCount} members
                                </span>
                              </div>
                              {t.members.length > 0 && (
                                <div className="ml-2 space-y-0.5">
                                  {t.members.map((m) => (
                                    <div
                                      key={m.id}
                                      className="flex items-center justify-between text-xs py-0.5"
                                    >
                                      <span className="text-muted-foreground">
                                        {m.name ?? "—"}
                                      </span>
                                      {m.gender && (
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                            m.gender === "Male"
                                              ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300"
                                              : m.gender === "Female"
                                                ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300"
                                                : "bg-gray-100 text-gray-600 border-gray-200"
                                          }`}
                                        >
                                          {m.gender}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Teams panel */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              Teams{" "}
              <span className="text-muted-foreground font-normal">
                ({filteredTeams.length}
                {filteredTeams.length !== teams.length
                  ? ` of ${teams.length}`
                  : ""}
                )
              </span>
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team name..."
                className="pl-8 h-9 text-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[150px] text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={trackFilter} onValueChange={setTrackFilter}>
              <SelectTrigger className="h-9 w-[140px] text-sm">
                <SelectValue placeholder="Track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tracks</SelectItem>
                {uniqueTracks.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="h-9 w-[160px] text-sm">
                <SelectValue placeholder="College" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Colleges</SelectItem>
                {uniqueColleges.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teams table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground text-sm"
                    >
                      No teams match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((t) => (
                    <TableRow
                      key={t.teamId}
                      className={
                        locked ? "" : "cursor-pointer hover:bg-muted/60"
                      }
                      onClick={() => !locked && handleOpenAssign(t)}
                    >
                      <TableCell className="font-mono text-xs">
                        {t.teamNo ?? "—"}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-sm">{t.teamName}</div>
                        {t.collegeName && (
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {t.collegeName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.trackName ? (
                          <Badge variant="outline" className="text-xs">
                            {t.trackName}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.assignedLabName ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800"
                          >
                            {t.assignedLabName}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800"
                          >
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {t.memberCount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalCapacity < teams.length && (
            <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-3">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Total lab capacity ({totalCapacity}) is less than number of
                selected teams. Some teams may not be assigned.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Team Assign Dialog */}
      <Dialog
        open={assignOpen}
        onOpenChange={(o) => {
          if (!o) {
            setAssignOpen(false);
            setSelectedTeam(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTeam
                ? `Assign — ${selectedTeam.teamName}`
                : "Assign Team"}
            </DialogTitle>
            <DialogDescription>
              Select a lab to assign this team to. Only labs with available
              capacity are shown.
            </DialogDescription>
          </DialogHeader>

          {selectedTeam && (
            <div className="space-y-4 py-1">
              {/* Team info */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedTeam.teamNo && (
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    #{selectedTeam.teamNo}
                  </span>
                )}
                {selectedTeam.trackName && (
                  <Badge variant="outline" className="text-xs">
                    {selectedTeam.trackName}
                  </Badge>
                )}
                {selectedTeam.collegeName && (
                  <span className="text-xs text-muted-foreground">
                    {selectedTeam.collegeName}
                  </span>
                )}
              </div>

              {selectedTeam.assignedLabName && (
                <div className="flex items-center justify-between rounded-md border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 px-3 py-2">
                  <span className="text-xs text-green-700 dark:text-green-300">
                    Assigned to <strong>{selectedTeam.assignedLabName}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-destructive hover:text-destructive px-2"
                    onClick={handleUnassign}
                    disabled={assigning !== null}
                  >
                    {assigning === "unassign" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span className="ml-1">Unassign</span>
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {labs.map((l) => {
                  const isCurrent = l.id === selectedTeam.assignedLabId;
                  const full = l.teamCount >= l.capacity;
                  const isAssigning = assigning === l.id;
                  const pct =
                    l.capacity > 0
                      ? Math.round((l.teamCount / l.capacity) * 100)
                      : 0;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      disabled={assigning !== null || (full && !isCurrent)}
                      onClick={() => handleAssign(l.id)}
                      className={`w-full rounded-md border px-3 py-2.5 text-sm transition-colors text-left ${
                        isCurrent
                          ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                          : full
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-muted/60"
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {isCurrent && (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          )}
                          <span className="font-medium">{l.name}</span>
                          {full && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 h-4 bg-red-100 text-red-600 border-red-200"
                            >
                              Full
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>
                            {l.teamCount} / {l.capacity}
                          </span>
                          {isAssigning && (
                            <Loader2 className="h-3 w-3 animate-spin ml-1" />
                          )}
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${full ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
                {labs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No labs created yet.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignOpen(false);
                setSelectedTeam(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Create Lab</DialogTitle>
            <DialogDescription>
              Add a new lab with a team capacity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lab Name</Label>
              <Input
                placeholder="e.g. CS Lab 101"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Team Capacity</Label>
              <Input
                type="number"
                placeholder="e.g. 10"
                min={1}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of teams this lab can hold.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isCreating ||
                !newName.trim() ||
                !newCapacity ||
                Number.parseInt(newCapacity, 10) <= 0
              }
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteTargetId}
        onOpenChange={(o) => !o && setDeleteTargetId(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Lab</DialogTitle>
            <DialogDescription>
              This will permanently delete the lab. Blocked if any teams are
              assigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-assign Result */}
      <Dialog open={autoResultOpen} onOpenChange={setAutoResultOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Auto-Assign Complete</DialogTitle>
          </DialogHeader>
          {autoResult && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {autoResult.assigned}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Assigned
                </div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {autoResult.notAssigned}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  No capacity
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setAutoResultOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
