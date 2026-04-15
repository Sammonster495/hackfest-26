"use client";

import {
  AlertTriangle,
  CheckCircle,
  Lock,
  Loader2,
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

type Dorm = {
  id: string;
  name: string;
  gender: "Male" | "Female" | "Prefer Not To Say";
  teamCount: number;
  participantCount: number;
};

type AllocationTeam = {
  teamId: string;
  teamName: string;
  teamNo: number | null;
  collegeName: string | null;
  memberCount: number;
  teamGender: "Male" | "Female" | "Prefer Not To Say" | "Mixed" | "Unknown";
  genderCounts: { Male: number; Female: number; "Prefer Not To Say": number };
  // non-mixed teams
  assignedDormId: string | null;
  assignedDormName: string | null;
  // mixed teams
  maleDormId: string | null;
  maleDormName: string | null;
  femaleDormId: string | null;
  femaleDormName: string | null;
};

const GENDER_BADGE: Record<string, string> = {
  Male: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  Female: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800",
  "Prefer Not To Say": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  Mixed: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800",
  Unknown: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_BADGE: Record<string, string> = {
  Assigned: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
  "Partially Assigned": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  Unassigned: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800",
  "Not Assignable": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
};

function teamStatus(t: AllocationTeam): "Assigned" | "Partially Assigned" | "Unassigned" | "Not Assignable" {
  if (t.teamGender === "Unknown") return "Not Assignable";
  if (t.teamGender === "Mixed") {
    const maleOk = t.genderCounts.Male === 0 || !!t.maleDormId;
    const femaleOk = t.genderCounts.Female === 0 || !!t.femaleDormId;
    if (maleOk && femaleOk) return "Assigned";
    if (maleOk || femaleOk) return "Partially Assigned";
    return "Unassigned";
  }
  return t.assignedDormId ? "Assigned" : "Unassigned";
}

export function DormsSubTab() {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [teams, setTeams] = useState<AllocationTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dormFilter, setDormFilter] = useState("all");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<"Male" | "Female" | "Prefer Not To Say">("Male");
  const [isCreating, setIsCreating] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [locked, setLocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("dorms-locked") === "true";
  });

  const toggleLocked = (val: boolean) => {
    setLocked(val);
    localStorage.setItem("dorms-locked", String(val));
  };
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<{
    assigned: number;
    notAssigned: number;
    notAssignableTeams: string[];
  } | null>(null);
  const [assignResultOpen, setAssignResultOpen] = useState(false);

  const [teamAssignOpen, setTeamAssignOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<AllocationTeam | null>(null);
  const [manualAssigning, setManualAssigning] = useState<string | null>(null); // dormId being assigned

  const [expandedDorm, setExpandedDorm] = useState<string | null>(null);
  const [dormTeams, setDormTeams] = useState<Record<string, { teamId: string | null; teamName: string; teamNo: number | null; memberCount: number; members: { id: string; name: string | null; gender: string | null }[] }[]>>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: needed
  useEffect(() => {
    setIsLoading(true);
    setDormTeams({});
    Promise.all([
      fetch("/api/dashboard/allocations/dorms").then((r) => r.json()),
      fetch("/api/dashboard/allocations/teams").then((r) => r.json()),
    ])
      .then(([dormsData, teamsData]) => {
        setDorms(dormsData.dorms ?? []);
        setTeams(teamsData.teams ?? []);
      })
      .catch(() => toast.error("Failed to load allocation data"))
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  // Derived filter options
  const uniqueColleges = useMemo(() => {
    const s = new Set<string>();
    for (const t of teams) if (t.collegeName) s.add(t.collegeName);
    return Array.from(s).sort();
  }, [teams]);

  const uniqueGenders = useMemo(() => {
    const s = new Set<string>();
    for (const t of teams) s.add(t.teamGender);
    return Array.from(s).sort();
  }, [teams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    let result = teams;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.teamName.toLowerCase().includes(q));
    }
    if (genderFilter !== "all") {
      result = result.filter((t) => t.teamGender === genderFilter);
    }
    if (collegeFilter !== "all") {
      result = result.filter((t) => t.collegeName === collegeFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => teamStatus(t) === statusFilter);
    }
    if (dormFilter !== "all") {
      result = result.filter((t) => t.assignedDormId === dormFilter);
    }
    return result;
  }, [teams, search, genderFilter, collegeFilter, statusFilter, dormFilter]);

  const hasActiveFilters =
    search.trim() || genderFilter !== "all" || collegeFilter !== "all" || statusFilter !== "all" || dormFilter !== "all";

  const totalAssigned = teams.filter((t) => teamStatus(t) === "Assigned").length;
  const totalPartial = teams.filter((t) => teamStatus(t) === "Partially Assigned").length;
  const totalUnassigned = teams.filter((t) => teamStatus(t) === "Unassigned").length;
  const totalNotAssignable = teams.filter((t) => teamStatus(t) === "Not Assignable").length;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/dashboard/allocations/dorms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), gender: newGender }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`Dorm "${newName}" created`);
      setCreateOpen(false);
      setNewName("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create dorm");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/allocations/dorms/${deleteTargetId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Dorm deleted");
      setDeleteTargetId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete dorm");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const res = await fetch("/api/dashboard/allocations/dorms/assign", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-assign failed");
      setAssignResult(data);
      setAssignResultOpen(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auto-assign failed");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleExpandDorm = async (dormId: string) => {
    if (expandedDorm === dormId) { setExpandedDorm(null); return; }
    setExpandedDorm(dormId);
    if (!dormTeams[dormId]) {
      const res = await fetch(`/api/dashboard/allocations/dorms/${dormId}`);
      const data = await res.json();
      setDormTeams((prev) => ({ ...prev, [dormId]: data.teams ?? [] }));
    }
  };

  const clearFilters = () => {
    setSearch("");
    setGenderFilter("all");
    setCollegeFilter("all");
    setStatusFilter("all");
    setDormFilter("all");
  };

  const handleOpenTeamAssign = (team: AllocationTeam) => {
    setSelectedTeam(team);
    setTeamAssignOpen(true);
  };

  const handleManualAssign = async (dormId: string, gender?: string) => {
    if (!selectedTeam) return;
    const key = gender ? `${dormId}-${gender}` : dormId;
    setManualAssigning(key);
    try {
      const res = await fetch(`/api/dashboard/allocations/dorms/${dormId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.teamId, action: "assign", ...(gender ? { gender } : {}) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(gender ? `${gender} members assigned` : `${selectedTeam.teamName} assigned`);
      setDormTeams({});
      // Optimistically update selectedTeam so dialog reflects new state immediately
      if (gender === "Male") setSelectedTeam((prev) => prev ? { ...prev, maleDormId: dormId, maleDormName: dorms.find((d) => d.id === dormId)?.name ?? null } : prev);
      else if (gender === "Female") setSelectedTeam((prev) => prev ? { ...prev, femaleDormId: dormId, femaleDormName: dorms.find((d) => d.id === dormId)?.name ?? null } : prev);
      setRefreshKey((k) => k + 1);
      if (!gender) { setTeamAssignOpen(false); setSelectedTeam(null); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setManualAssigning(null);
    }
  };

  const handleManualUnassign = async (gender?: string) => {
    if (!selectedTeam) return;
    const dormId = gender
      ? (gender === "Male" ? selectedTeam.maleDormId : selectedTeam.femaleDormId)
      : selectedTeam.assignedDormId;
    if (!dormId) return;
    const key = gender ? `unassign-${gender}` : "unassign";
    setManualAssigning(key);
    try {
      const res = await fetch(`/api/dashboard/allocations/dorms/${dormId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.teamId, action: "unassign", ...(gender ? { gender } : {}) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(gender ? `${gender} members unassigned` : `${selectedTeam.teamName} unassigned`);
      setDormTeams({});
      if (gender === "Male") setSelectedTeam((prev) => prev ? { ...prev, maleDormId: null, maleDormName: null } : prev);
      else if (gender === "Female") setSelectedTeam((prev) => prev ? { ...prev, femaleDormId: null, femaleDormName: null } : prev);
      setRefreshKey((k) => k + 1);
      if (!gender) { setTeamAssignOpen(false); setSelectedTeam(null); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unassign");
    } finally {
      setManualAssigning(null);
    }
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
            Assign selected teams to dorms based on participant gender
          </p>
          {locked && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="h-3 w-3" /> View only
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoAssign}
            disabled={locked || isAssigning || dorms.length === 0}
          >
            {isAssigning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
            Auto-Assign
          </Button>
          <Button size="sm" disabled={locked} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Dorm
          </Button>
          <Button
            variant={locked ? "default" : "outline"}
            size="sm"
            onClick={() => toggleLocked(!locked)}
            className={locked ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : ""}
          >
            {locked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
            {locked ? "Unlock" : "Lock"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Selected</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{teams.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Assigned</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalAssigned}</div>
            {totalPartial > 0 && <p className="text-xs text-blue-500 mt-1">{totalPartial} partial (mixed)</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unassigned</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{totalUnassigned}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Not Assignable</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalNotAssignable}</div>
            <p className="text-xs text-muted-foreground mt-1">Unknown gender</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Dorms panel */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-sm">Dorms ({dorms.length})</h3>
          {dorms.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
              No dorms yet. Click "Add Dorm" to get started.
            </div>
          ) : (
            dorms.map((dorm) => (
              <div key={dorm.id} className="rounded-lg border">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleExpandDorm(dorm.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleExpandDorm(dorm.id)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{dorm.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dorm.teamCount} teams · {dorm.participantCount} participants
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${GENDER_BADGE[dorm.gender]}`}>
                      {dorm.gender}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={locked || dorm.teamCount > 0}
                      title={locked ? "Unlock to delete" : dorm.teamCount > 0 ? `Reassign ${dorm.teamCount} team(s) before deleting` : "Delete dorm"}
                      onClick={(e) => { e.stopPropagation(); setDeleteTargetId(dorm.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {expandedDorm === dorm.id && (
                  <div className="border-t px-4 pb-3 pt-2">
                    {!dormTeams[dorm.id] ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="h-3 w-3 animate-spin" />Loading...
                      </div>
                    ) : dormTeams[dorm.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No teams assigned yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {dormTeams[dorm.id].map((t) => (
                          <div key={t.teamId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold">{t.teamNo ? `${t.teamNo}. ` : ""}{t.teamName}</span>
                              <span className="text-muted-foreground">{t.memberCount} members</span>
                            </div>
                            {t.members.length > 0 && (
                              <div className="ml-2 space-y-0.5">
                                {t.members.map((m) => (
                                  <div key={m.id} className="flex items-center justify-between text-xs py-0.5">
                                    <span className="text-muted-foreground">{m.name ?? "—"}</span>
                                    {m.gender && (
                                      <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${GENDER_BADGE[m.gender] ?? GENDER_BADGE.Unknown}`}>
                                        {m.gender}
                                      </Badge>
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
            ))
          )}
        </div>

        {/* Teams panel */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              Teams{" "}
              <span className="text-muted-foreground font-normal">
                ({filteredTeams.length}{filteredTeams.length !== teams.length ? ` of ${teams.length}` : ""})
              </span>
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
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

            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="h-9 w-[130px] text-sm">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {uniqueGenders.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[150px] text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="Partially Assigned">Partially Assigned</SelectItem>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                <SelectItem value="Not Assignable">Not Assignable</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dormFilter} onValueChange={setDormFilter}>
              <SelectTrigger className="h-9 w-[140px] text-sm">
                <SelectValue placeholder="Dorm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dorms</SelectItem>
                {dorms.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="h-9 w-[160px] text-sm">
                <SelectValue placeholder="College" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Colleges</SelectItem>
                {uniqueColleges.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
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
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                      No teams match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((t) => {
                    const status = teamStatus(t);
                    return (
                      <TableRow
                        key={t.teamId}
                        className={locked ? "" : "cursor-pointer hover:bg-muted/60"}
                        onClick={() => !locked && handleOpenTeamAssign(t)}
                      >
                        <TableCell className="font-mono text-xs">{t.teamNo ?? "—"}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{t.teamName}</div>
                          {t.collegeName && (
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {t.collegeName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${GENDER_BADGE[t.teamGender]}`}>
                            {t.teamGender}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <Badge variant="outline" className={`text-xs ${STATUS_BADGE[status]}`}>
                              {status}
                            </Badge>
                            {t.teamGender === "Mixed" ? (
                              <div className="space-y-0.5">
                                {t.maleDormName && <div className="text-[11px] text-blue-600 dark:text-blue-400">♂ {t.maleDormName}</div>}
                                {t.femaleDormName && <div className="text-[11px] text-pink-600 dark:text-pink-400">♀ {t.femaleDormName}</div>}
                              </div>
                            ) : (
                              t.assignedDormName && <div className="text-xs text-muted-foreground">{t.assignedDormName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{t.memberCount}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {teams.some((t) => t.teamGender === "Mixed") && (
            <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-3">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Mixed-gender teams are skipped by auto-assign. Click a mixed team to manually assign male and female members to separate dorms.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Create Dorm</DialogTitle>
            <DialogDescription>Add a new dormitory with a designated gender.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Dorm Name</Label>
              <Input
                placeholder="e.g. Block A – Male"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={newGender} onValueChange={(v) => setNewGender(v as typeof newGender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Prefer Not To Say">Prefer Not To Say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
              {isCreating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Dorm</DialogTitle>
            <DialogDescription>
              This will permanently delete the dorm. Blocked if any teams are currently assigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Assign Dialog */}
      <Dialog open={teamAssignOpen} onOpenChange={(o) => { if (!o) { setTeamAssignOpen(false); setSelectedTeam(null); } }}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTeam ? `Assign — ${selectedTeam.teamName}` : "Assign Team"}</DialogTitle>
            <DialogDescription>
              {selectedTeam?.teamGender === "Mixed"
                ? "Mixed team: assign male and female members to separate dorms."
                : "Select a dorm to assign this team to."}
            </DialogDescription>
          </DialogHeader>

          {selectedTeam && (
            <div className="space-y-4 py-1">
              {/* Team info */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedTeam.teamNo && (
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">#{selectedTeam.teamNo}</span>
                )}
                <Badge variant="outline" className={`text-xs ${GENDER_BADGE[selectedTeam.teamGender]}`}>
                  {selectedTeam.teamGender}
                </Badge>
                {selectedTeam.genderCounts.Male > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${GENDER_BADGE.Male}`}>{selectedTeam.genderCounts.Male} Male</span>
                )}
                {selectedTeam.genderCounts.Female > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${GENDER_BADGE.Female}`}>{selectedTeam.genderCounts.Female} Female</span>
                )}
              </div>

              {selectedTeam.teamGender === "Mixed" ? (
                /* Mixed team: two independent sections */
                <div className="space-y-5">
                  {(["Male", "Female"] as const).filter((g) => selectedTeam.genderCounts[g] > 0).map((g) => {
                    const currentDormId = g === "Male" ? selectedTeam.maleDormId : selectedTeam.femaleDormId;
                    const currentDormName = g === "Male" ? selectedTeam.maleDormName : selectedTeam.femaleDormName;
                    const compatibleDorms = dorms.filter((d) => d.gender === g);
                    return (
                      <div key={g} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${g === "Male" ? "text-blue-600 dark:text-blue-400" : "text-pink-600 dark:text-pink-400"}`}>
                            {g} Members ({selectedTeam.genderCounts[g]})
                          </p>
                          {currentDormName && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">→ {currentDormName}</span>
                              <button
                                type="button"
                                className="text-destructive hover:text-destructive text-xs flex items-center gap-0.5 disabled:opacity-50"
                                disabled={manualAssigning !== null}
                                onClick={() => handleManualUnassign(g)}
                              >
                                {manualAssigning === `unassign-${g}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                Unassign
                              </button>
                            </div>
                          )}
                        </div>
                        {compatibleDorms.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No {g.toLowerCase()} dorms created yet.</p>
                        ) : (
                          compatibleDorms.map((d) => {
                            const isCurrent = d.id === currentDormId;
                            const isAssigningThis = manualAssigning === `${d.id}-${g}`;
                            return (
                              <button
                                key={d.id}
                                type="button"
                                disabled={manualAssigning !== null}
                                onClick={() => handleManualAssign(d.id, g)}
                                className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                                  isCurrent ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "hover:bg-muted/60"
                                } disabled:opacity-50`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCurrent && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                                  <span className="font-medium">{d.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{d.teamCount} teams · {d.participantCount} members</span>
                                  {isAssigningThis && <Loader2 className="h-3 w-3 animate-spin" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Non-mixed: only show compatible dorms */
                <div className="space-y-2">
                  {selectedTeam.assignedDormName && (
                    <div className="flex items-center justify-between rounded-md border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 px-3 py-2">
                      <span className="text-xs text-green-700 dark:text-green-300">
                        Assigned to <strong>{selectedTeam.assignedDormName}</strong>
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive px-2"
                        onClick={() => handleManualUnassign()}
                        disabled={manualAssigning !== null}
                      >
                        {manualAssigning === "unassign" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        <span className="ml-1">Unassign</span>
                      </Button>
                    </div>
                  )}
                  {(() => {
                    const compatibleDorms = dorms.filter((d) => d.gender === selectedTeam.teamGender);
                    if (compatibleDorms.length === 0) return (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No {selectedTeam.teamGender.toLowerCase()} dorms created yet.
                      </p>
                    );
                    return compatibleDorms.map((d) => {
                      const isCurrent = d.id === selectedTeam.assignedDormId;
                      const isAssigningThis = manualAssigning === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={manualAssigning !== null}
                          onClick={() => handleManualAssign(d.id)}
                          className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                            isCurrent ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "hover:bg-muted/60"
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center gap-2">
                            {isCurrent && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                            <span className="font-medium">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{d.teamCount} teams · {d.participantCount} members</span>
                            {isAssigningThis && <Loader2 className="h-3 w-3 animate-spin" />}
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setTeamAssignOpen(false); setSelectedTeam(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-assign Result */}
      <Dialog open={assignResultOpen} onOpenChange={setAssignResultOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Auto-Assign Complete</DialogTitle></DialogHeader>
          {assignResult && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{assignResult.assigned}</div>
                  <div className="text-xs text-muted-foreground mt-1">Assigned</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{assignResult.notAssigned}</div>
                  <div className="text-xs text-muted-foreground mt-1">Not Assigned</div>
                </div>
              </div>
              {assignResult.notAssignableTeams.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Could not assign (mixed gender):</p>
                  <div className="rounded-md border bg-muted/50 p-2 max-h-32 overflow-y-auto">
                    {assignResult.notAssignableTeams.map((name) => (
                      <p key={name} className="text-xs py-0.5">{name}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setAssignResultOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
