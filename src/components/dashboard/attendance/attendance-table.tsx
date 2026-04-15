"use client";

import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Search,
    Users,
    X,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Checkbox } from "~/components/ui/checkbox";
import {
    fetchTeamsForAttendance,
    fetchTeamDetails,
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

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [attendedFilter, setAttendedFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(25);
    const [refreshKey, setRefreshKey] = useState(0);

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

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchTeamsForAttendance({
            search: debouncedSearch,
            attended: attendedFilter,
            paymentStatus: paymentFilter,
            limit: 500,
        });
        setTeams(data.teams);
        setIsLoading(false);
    }, [debouncedSearch, attendedFilter, paymentFilter, refreshKey]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, attendedFilter, paymentFilter]);

    const handleRefresh = () => {
        setRefreshKey((k) => k + 1);
    };

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

        await scanAttendance({
            teamId: selectedTeam.id,
            presentParticipantIds,
        });

        setIsMarking(false);
        setDialogOpen(false);
        handleRefresh();
    };

    const totalTeams = teams.length;
    const presentTeams = teams.filter((t) => t.attended).length;
    const absentTeams = totalTeams - presentTeams;

    const totalPages = Math.max(1, Math.ceil(totalTeams / pageSize));
    const paginatedTeams = teams.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const hasActiveFilters =
        search.trim() !== "" ||
        attendedFilter !== "all" ||
        paymentFilter !== "all";

    const clearFilters = () => {
        setSearch("");
        setAttendedFilter("all");
        setPaymentFilter("all");
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                        <CardTitle className="text-sm font-medium">Present</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {presentTeams}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Absent</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {absentTeams}
                        </div>
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
                    disabled={isLoading}
                    title="Refresh"
                    className="h-9 w-9"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                </Button>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead className="text-right">Attendance</TableHead>
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
                                                {team.attended ? "Present" : "Absent"}
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

            {!isLoading && totalTeams > 0 && (
                <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-sm text-muted-foreground">
                    <span>
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, totalTeams)} of {totalTeams}{" "}
                        teams
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
