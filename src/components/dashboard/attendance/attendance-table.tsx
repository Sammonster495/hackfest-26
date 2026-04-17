"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  fetchTeamDetails,
  fetchTeamsForAttendance,
  scanAttendance,
  type TeamRow,
} from "./request";

interface Member {
  id: string;
  name: string;
  email: string;
  attended?: boolean;
}

interface TeamData {
  id: string;
  name: string;
  members: Member[];
}

export function AttendanceTable() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendanceSort, setAttendanceSort] = useState<"none" | "asc" | "desc">(
    "none",
  );

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [attendedFilter, setAttendedFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [_refreshKey, setRefreshKey] = useState(0);
  const hasInitialized = useRef(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [presentMembers, setPresentMembers] = useState<Record<string, boolean>>(
    {},
  );
  const [isMarking, setIsMarking] = useState(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const hasFetchedOnce = useRef(false);

  const fetchData = useCallback(
    async (quiet = false) => {
      const isQuiet = quiet || hasFetchedOnce.current;

      if (!isQuiet) setIsLoading(true);
      else setIsRefreshing(true);

      const data = await fetchTeamsForAttendance({
        search: debouncedSearch,
        attended: attendedFilter,
        paymentStatus: paymentFilter,
        limit: 500,
      });
      setTeams(data.teams);
      hasFetchedOnce.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [debouncedSearch, attendedFilter, paymentFilter],
  );

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      void fetchData();
    } else {
      void fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    void fetchData(true);
  }, [fetchData]);

  const openAttendanceDialog = async (team: TeamRow) => {
    setIsLoadingTeam(true);
    setDialogOpen(true);
    setSelectedTeam(null);
    setPresentMembers({});

    const teamDetails = await fetchTeamDetails(team.id);
    if (teamDetails) {
      setSelectedTeam(teamDetails);
      const initialPresence: Record<string, boolean> = {};
      if (teamDetails.members) {
        // If the team was previously marked attended, load individual member states.
        // Otherwise, default all to true for quick checking.
        teamDetails.members.forEach((m: Member) => {
          initialPresence[m.id] = team.attended ? !!m.attended : true;
        });
      }
      setPresentMembers(initialPresence);
    }
    setIsLoadingTeam(false);
  };

  const toggleMember = (memberId: string) => {
    setPresentMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleConfirmAttendance = async () => {
    if (!selectedTeam) return;

    setIsMarking(true);
    const presentParticipantIds = Object.entries(presentMembers)
      .filter(([_, isPresent]) => isPresent)
      .map(([id]) => id);

    // Optimistic Update
    const prevTeamIndex = teams.findIndex((t) => t.id === selectedTeam.id);
    if (prevTeamIndex !== -1) {
      const newTeams = [...teams];
      newTeams[prevTeamIndex] = {
        ...newTeams[prevTeamIndex],
        attended: presentParticipantIds.length > 0,
        presentCount: presentParticipantIds.length,
      };
      setTeams(newTeams);
    }

    await scanAttendance({
      teamId: selectedTeam.id,
      presentParticipantIds,
    });

    setIsMarking(false);
    setDialogOpen(false);
  };

  const getAttendanceScore = useCallback((t: TeamRow) => {
    if (!t.attended) return 0;
    if (t.presentCount > 0 && t.presentCount < t.memberCount) return 1;
    return 2;
  }, []);

  const totalTeams = teams.length;
  const partialTeams = teams.filter(
    (t) => t.attended && t.presentCount > 0 && t.presentCount < t.memberCount,
  ).length;
  const fullyPresentTeams =
    teams.filter((t) => t.attended).length - partialTeams;
  const absentTeams = totalTeams - fullyPresentTeams - partialTeams;

  const totalPages = Math.max(1, Math.ceil(totalTeams / pageSize));
  const paginatedTeams = teams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasActiveFilters =
    search.trim() !== "" || attendedFilter !== "all" || paymentFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setAttendedFilter("all");
    setPaymentFilter("all");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fullyPresentTeams}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {partialTeams}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentTeams}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name..."
            className="pl-9"
          />
        </div>

        <Select value={attendedFilter} onValueChange={setAttendedFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm font-normal">
            <SelectValue placeholder="Attendance" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="true">Present</SelectItem>
            <SelectItem value="false">Absent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm font-normal">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          title="Refresh"
          className="h-9 w-9"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading || isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="hidden md:block rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Team Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">
                <div className="flex justify-end pr-[4px]">
                  <Button
                    variant="ghost"
                    className="h-8 -mr-3 px-3 relative right-[-10px] hover:bg-transparent"
                    onClick={() =>
                      setAttendanceSort((s) =>
                        s === "none" ? "asc" : s === "asc" ? "desc" : "none",
                      )
                    }
                  >
                    Attendance
                    {attendanceSort === "asc" && (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    )}
                    {attendanceSort === "desc" && (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                    {attendanceSort === "none" && <div className="ml-1 w-4" />}
                  </Button>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading teams...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedTeams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "No teams match your filters."
                    : "No teams found."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedTeams.map((team, index) => (
                <TableRow
                  key={team.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.memberCount}</TableCell>
                  <TableCell>
                    {team.paymentStatus ? (
                      <Badge
                        variant={
                          team.paymentStatus === "Paid"
                            ? "success"
                            : team.paymentStatus === "Pending"
                              ? "warning"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {team.paymentStatus}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {team.teamStage.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-sm text-muted-foreground">
                        {team.attended
                          ? team.presentCount > 0 &&
                            team.presentCount < team.memberCount
                            ? `Partial (${team.presentCount}/${team.memberCount})`
                            : "Present"
                          : "Absent"}
                      </span>
                      <Button
                        size="sm"
                        variant={team.attended ? "outline" : "default"}
                        onClick={() => openAttendanceDialog(team)}
                        className="min-w-32 text-xs"
                      >
                        {team.attended ? "Edit Attendance" : "Mark Attendance"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden">
        {isLoading ? (
          <div className="col-span-1 h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading teams...
          </div>
        ) : paginatedTeams.length === 0 ? (
          <div className="col-span-1 h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
            {hasActiveFilters
              ? "No teams match your filters."
              : "No teams found."}
          </div>
        ) : (
          paginatedTeams.map((team, index) => (
            <Card
              key={team.id}
              className="flex flex-col p-4 shadow-sm border-muted-foreground/20"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-base">{team.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    #{(currentPage - 1) * pageSize + index + 1} •{" "}
                    {team.memberCount} Members
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal leading-tight whitespace-nowrap"
                >
                  {team.teamStage.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {team.paymentStatus ? (
                  <Badge
                    variant={
                      team.paymentStatus === "Paid"
                        ? "success"
                        : team.paymentStatus === "Pending"
                          ? "warning"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {team.paymentStatus}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                    No Payment
                  </span>
                )}

                <span
                  className={`text-xs ml-auto font-medium ${team.attended ? (team.presentCount > 0 && team.presentCount < team.memberCount ? "text-yellow-600" : "text-green-600") : "text-red-500"}`}
                >
                  {team.attended
                    ? team.presentCount > 0 &&
                      team.presentCount < team.memberCount
                      ? `Partial (${team.presentCount}/${team.memberCount})`
                      : "Present"
                    : "Absent"}
                </span>
              </div>

              <Button
                size="sm"
                variant={team.attended ? "outline" : "default"}
                onClick={() => openAttendanceDialog(team)}
                className="w-full text-xs h-9"
              >
                {team.attended ? "Edit Attendance" : "Mark Attendance"}
              </Button>
            </Card>
          ))
        )}
      </div>

      {!isLoading && totalTeams > 0 && (
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-sm text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalTeams)} of {totalTeams} teams
          </span>
          <div className="flex items-center gap-2">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1 ml-2">
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
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Team Attendance</DialogTitle>
          </DialogHeader>
          <div className="w-full min-h-[200px] flex flex-col items-center justify-center p-2">
            {isLoadingTeam && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Fetching team details...
                </p>
              </div>
            )}

            {selectedTeam && !isLoadingTeam && (
              <div className="w-full space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedTeam.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Verify team members present
                  </p>
                </div>

                <div className="space-y-3 mt-4 border rounded-md p-3 max-h-[40vh] overflow-y-auto">
                  {selectedTeam.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <Checkbox
                        id={`table-member-${member.id}`}
                        checked={!!presentMembers[member.id]}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <label
                        htmlFor={`table-member-${member.id}`}
                        className="flex-1 text-sm font-medium leading-none cursor-pointer"
                      >
                        {member.name}
                        <span className="block text-xs font-normal text-muted-foreground mt-1">
                          {member.email}
                        </span>
                      </label>
                    </div>
                  ))}
                  {(!selectedTeam.members ||
                    selectedTeam.members.length === 0) && (
                    <p className="text-sm text-center text-muted-foreground py-2">
                      No members found
                    </p>
                  )}
                </div>

                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleConfirmAttendance}
                  disabled={isMarking}
                >
                  {isMarking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isMarking ? "Saving..." : "Confirm Attendance"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
