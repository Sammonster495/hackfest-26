"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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

type SubmissionRow = {
  teamId: string;
  teamName: string;
  collegeName: string | null;
  stateName: string | null;
  trackId: string;
  trackName: string | null;
  teamStage: "NOT_SELECTED" | "SEMI_SELECTED" | "SELECTED";
  teamProgress:
    | "WINNER"
    | "RUNNER"
    | "SECOND_RUNNER"
    | "TRACK"
    | "PARTICIPATION"
    | null;
  pptUrl: string | null;
  createdAt: string;
};

export function AllSubmissions() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [trackIdFilter, setTrackIdFilter] = useState("all");
  const [stateNameFilter, setStateNameFilter] = useState("all");
  const [collegeNameFilter, setCollegeNameFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isMoving, _setIsMoving] = useState(false);
  const [refreshKey, _setRefreshKey] = useState(0);

  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<
    "leader_emails" | "all_emails" | "csv"
  >("csv");
  const [isExporting, setIsExporting] = useState(false);

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsModalType, setStatsModalType] = useState<"colleges" | "states">(
    "colleges",
  );

  const allColumns = [
    "Team Name",
    "Leader Name",
    "Leader Email",
    "All Emails",
    "College",
    "State",
    "Track",
    "Stage",
    "Progress",
    "PPT URL",
    "Leader Phone",
    "Phone",
    "Payment Status",
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <needed>
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/dashboard/submissions/all")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load submissions");
        return res.json();
      })
      .then((data) => {
        setRows(data.rows || []);
        setSelectedTeamIds((prev) =>
          prev.filter((id) =>
            (data.rows || []).some((r: any) => r.teamId === id),
          ),
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load full submissions list");
      })
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  const uniqueTracks = useMemo(() => {
    const tracks = new Map<string, string>();
    for (const row of rows) {
      if (row.trackId && row.trackName) {
        tracks.set(row.trackId, row.trackName);
      }
    }
    return Array.from(tracks.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    for (const row of rows) {
      if (row.stateName) states.add(row.stateName);
    }
    return Array.from(states).sort();
  }, [rows]);

  const uniqueColleges = useMemo(() => {
    const colleges = new Set<string>();
    for (const row of rows) {
      if (row.collegeName) colleges.add(row.collegeName);
    }
    return Array.from(colleges).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.teamName.toLowerCase().includes(q));
    }
    if (trackIdFilter !== "all") {
      result = result.filter((r) => r.trackId === trackIdFilter);
    }
    if (stateNameFilter !== "all") {
      result = result.filter((r) => r.stateName === stateNameFilter);
    }
    if (collegeNameFilter !== "all") {
      result = result.filter((r) => r.collegeName === collegeNameFilter);
    }
    if (stageFilter !== "all") {
      result = result.filter((r) => r.teamStage === stageFilter);
    }
    if (progressFilter !== "all") {
      if (progressFilter === "none") {
        result = result.filter((r) => !r.teamProgress);
      } else {
        result = result.filter((r) => r.teamProgress === progressFilter);
      }
    }

    return result;
  }, [
    rows,
    search,
    trackIdFilter,
    stateNameFilter,
    collegeNameFilter,
    stageFilter,
    progressFilter,
  ]);

  const dataSourceForBreakdown = useMemo(() => {
    return selectedTeamIds.length > 0
      ? rows.filter((r) => selectedTeamIds.includes(r.teamId))
      : filteredRows;
  }, [rows, selectedTeamIds, filteredRows]);

  const collegesBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const team of dataSourceForBreakdown) {
      if (!team.collegeName) continue;
      counts.set(team.collegeName, (counts.get(team.collegeName) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [dataSourceForBreakdown]);

  const statesBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const team of dataSourceForBreakdown) {
      if (!team.stateName) continue;
      counts.set(team.stateName, (counts.get(team.stateName) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [dataSourceForBreakdown]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <needed>
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    trackIdFilter,
    stateNameFilter,
    collegeNameFilter,
    stageFilter,
    progressFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedCount = useMemo(
    () => rows.filter((r) => r.teamStage === "SELECTED").length,
    [rows],
  );

  const toggleSelectAllVisible = (checked: boolean) => {
    const visibleIds = paginatedRows.map((r) => r.teamId);
    if (checked) {
      setSelectedTeamIds((prev) =>
        Array.from(new Set([...prev, ...visibleIds])),
      );
    } else {
      setSelectedTeamIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id)),
      );
    }
  };
  const allVisibleSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((r) => selectedTeamIds.includes(r.teamId));

  const toggleRowSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds((prev) =>
      checked ? [...prev, teamId] : prev.filter((id) => id !== teamId),
    );
  };

  // const handleMove = async (
  //   nextStage: "NOT_SELECTED" | "SEMI_SELECTED" | "SELECTED",
  // ) => {
  //   if (selectedTeamIds.length === 0) return;
  //   setIsMoving(true);
  //   try {
  //     const res = await fetch("/api/dashboard/submissions/bulk-move", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ teamIds: selectedTeamIds, nextStage }),
  //     });
  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.message || "Failed to move teams");
  //     toast.success(data.message);
  //     setSelectedTeamIds([]);
  //     setRefreshKey((prev) => prev + 1);
  //   } catch (error: any) {
  //     toast.error(error.message || "Error moving teams");
  //   } finally {
  //     setIsMoving(false);
  //   }
  // };

  const handleDownload = async () => {
    if (selectedTeamIds.length === 0) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/dashboard/submissions/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamIds: selectedTeamIds,
          exportType,
          columns: exportType === "csv" ? selectedColumns : undefined,
        }),
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = exportType === "csv" ? "csv" : "txt";
      const formatName =
        exportType === "csv" ? "hackfest_teams_export" : exportType;
      a.download = `${formatName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadDialogOpen(false);
      toast.success("Download generated successfully");
    } catch (_error) {
      toast.error("Failed to generate export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Selected Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Colleges
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStatsModalType("colleges");
                setStatsModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4 text-muted-foreground pointer-events-none" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collegesBreakdown.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {selectedTeamIds.length > 0 ? "selected" : "filtered"}{" "}
              teams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique States</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStatsModalType("states");
                setStatsModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4 text-muted-foreground pointer-events-none" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statesBreakdown.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {selectedTeamIds.length > 0 ? "selected" : "filtered"}{" "}
              teams
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by team name"
            className="pl-9"
          />
        </div>

        <Select value={trackIdFilter} onValueChange={setTrackIdFilter}>
          <SelectTrigger className="h-9 w-[180px] text-sm font-normal">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all">All Tracks</SelectItem>
            {uniqueTracks.map((track) => (
              <SelectItem key={track.id} value={track.id}>
                {track.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stateNameFilter} onValueChange={setStateNameFilter}>
          <SelectTrigger className="h-9 w-[180px] text-sm font-normal">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all">All States</SelectItem>
            {uniqueStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={collegeNameFilter} onValueChange={setCollegeNameFilter}>
          <SelectTrigger className="h-9 w-[180px] text-sm font-normal">
            <SelectValue placeholder="College" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all">All Colleges</SelectItem>
            {uniqueColleges.map((college) => (
              <SelectItem key={college} value={college}>
                {college}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm font-normal">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="NOT_SELECTED">Not Selected</SelectItem>
            <SelectItem value="SEMI_SELECTED">Semi Selected</SelectItem>
            <SelectItem value="SELECTED">Selected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={progressFilter} onValueChange={setProgressFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm font-normal">
            <SelectValue placeholder="Progress" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem value="all">All Progress</SelectItem>
            <SelectItem value="none">Pending</SelectItem>
            <SelectItem value="PARTICIPATION">Participation</SelectItem>
            <SelectItem value="TRACK">Track Winner</SelectItem>
            <SelectItem value="SECOND_RUNNER">Second Runner</SelectItem>
            <SelectItem value="RUNNER">Runner</SelectItem>
            <SelectItem value="WINNER">Winner</SelectItem>
          </SelectContent>
        </Select>

        {selectedTeamIds.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
            {/* <Button
              disabled={isMoving || isExporting}
              onClick={() => handleMove("NOT_SELECTED")}
              variant="destructive"
              className="h-9 text-sm"
            >
              Move {selectedTeamIds.length} to Not-Selected
            </Button>
            <Button
              disabled={isMoving || isExporting}
              onClick={() => handleMove("SEMI_SELECTED")}
              variant="outline"
              className="h-9 text-sm"
            >
              Move {selectedTeamIds.length} to Semi-Selected
            </Button>
            <Button
              disabled={isMoving || isExporting}
              onClick={() => handleMove("SELECTED")}
              className="h-9 text-sm"
            >
              Move {selectedTeamIds.length} to Selected
            </Button> */}
            <Button
              disabled={isMoving || isExporting}
              onClick={() => setDownloadDialogOpen(true)}
              variant="secondary"
              className="h-9 text-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </div>

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Download Data</DialogTitle>
            <DialogDescription>
              Export data for the {selectedTeamIds.length} selected teams.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportType}
                onValueChange={(val: any) => setExportType(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leader_emails">
                    Leader Emails (.txt)
                  </SelectItem>
                  <SelectItem value="all_emails">
                    All Member Emails (.txt)
                  </SelectItem>
                  <SelectItem value="csv">
                    Detailed Spreadsheet (.csv)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {exportType === "csv" && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Columns to Include</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => {
                      if (selectedColumns.length === allColumns.length) {
                        setSelectedColumns([]);
                      } else {
                        setSelectedColumns(allColumns);
                      }
                    }}
                  >
                    {selectedColumns.length === allColumns.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {allColumns.map((col) => (
                    <div key={col} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${col}`}
                        checked={selectedColumns.includes(col)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedColumns((prev) => [...prev, col]);
                          } else {
                            setSelectedColumns((prev) =>
                              prev.filter((c) => c !== col),
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`col-${col}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {col}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDownloadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={
                isExporting ||
                (exportType === "csv" && selectedColumns.length === 0)
              }
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {statsModalType === "colleges"
                ? "Colleges Breakdown"
                : "States Breakdown"}
            </DialogTitle>
            <DialogDescription>
              Count of submissions per{" "}
              {statsModalType === "colleges" ? "college" : "state"}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 px-1 rounded-md border bg-card">
            <Table>
              <TableHeader className="sticky top-0 bg-background shadow-sm border-b z-10">
                <TableRow>
                  <TableHead>
                    {statsModalType === "colleges"
                      ? "College/University"
                      : "State/City"}
                  </TableHead>
                  <TableHead className="text-right">Teams</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(statsModalType === "colleges"
                  ? collegesBreakdown
                  : statesBreakdown
                ).map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium text-sm">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
                {(statsModalType === "colleges"
                  ? collegesBreakdown
                  : statesBreakdown
                ).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground py-4 text-sm"
                    >
                      No data available based on current selection.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) =>
                    toggleSelectAllVisible(checked === true)
                  }
                  aria-label="Select all teams"
                />
              </TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Team Name</TableHead>
              <TableHead className="text-center w-12">PPT</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>College / State</TableHead>
              <TableHead className="text-right">Submitted At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading submissions...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  No submissions found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, index) => (
                <TableRow
                  key={row.teamId}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    toggleRowSelection(
                      row.teamId,
                      !selectedTeamIds.includes(row.teamId),
                    )
                  }
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTeamIds.includes(row.teamId)}
                      onCheckedChange={(checked) =>
                        toggleRowSelection(row.teamId, checked === true)
                      }
                      aria-label={`Select ${row.teamName}`}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{row.teamName}</TableCell>
                  <TableCell className="text-center">
                    {row.pptUrl ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(row.pptUrl!, "_blank");
                        }}
                        title="View PPT"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.trackName ? (
                      <Badge
                        variant="secondary"
                        className="font-normal text-xs"
                      >
                        {row.trackName}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.teamStage === "SELECTED"
                          ? "default"
                          : row.teamStage === "SEMI_SELECTED"
                            ? "secondary"
                            : "destructive"
                      }
                      className="font-medium text-xs whitespace-nowrap"
                    >
                      {row.teamStage.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.teamProgress ? (
                      <Badge
                        variant="outline"
                        className="font-medium text-xs whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800"
                      >
                        {row.teamProgress.replace("_", " ")}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-sm truncate max-w-[200px]"
                        title={row.collegeName || ""}
                      >
                        {row.collegeName || "No College"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {row.stateName || "No State"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && filteredRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-sm text-muted-foreground">
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
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {currentPage} of {totalPages} ({filteredRows.length} total)
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
    </div>
  );
}
