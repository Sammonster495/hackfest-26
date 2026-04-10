"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { SelectedTeams } from "~/db/services/worker-services";
import { apiFetch } from "~/lib/fetcher";
import type { Task, TaskStats } from "~/lib/worker/dashboard";
import type { Team } from "~/lib/worker/task";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";

const workers = [
  {
    id: "stats",
    name: "Stats",
    description: "Statistics about the worker",
    content: <WorkerStatsTab />,
  },
  {
    id: "task-list",
    name: "Task List",
    description: "List of all tasks executed by the worker",
    content: <TaskListTab />,
  },
  {
    id: "github-properties",
    name: "Properties",
    description: "Updates properties of GitHub repositories based on criteria",
    content: <GithubRepoAccessTab />,
  },
  {
    id: "top-60-notification",
    name: "Top 60 Notification",
    description:
      "Sends notifications to teams when they enter the top 60 based on scores",
    content: <Top60NotificationTab />,
  },
  {
    id: "github-automation",
    name: "GitHub Automation",
    description: "Automates GitHub repository management tasks",
    content: <GithubAutomationTab />,
  },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "SUCCESS", label: "SUCCESS" },
  { value: "FAILURE", label: "FAILURE" },
  { value: "PENDING", label: "PENDING" },
  { value: "STARTED", label: "STARTED" },
  { value: "RETRY", label: "RETRY" },
];

const LIMIT_OPTIONS = [10, 25, 50, 100, 200, 500];

function fmtDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function pretty(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function WorkerManagementTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Worker Management</h2>
        <p className="text-muted-foreground">
          Manage worker external worker tasks
        </p>
      </div>

      <Tabs defaultValue="task-list">
        <TabsList>
          {workers.map((worker) => (
            <TabsTrigger key={worker.id} value={worker.id}>
              {worker.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {workers.map((worker) => (
          <TabsContent key={worker.id} value={worker.id}>
            {worker.content}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              This action cannot be undone. To confirm, please type the track ID
              below.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkerStatsTab() {
  const [stats, setStats] = useState<TaskStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await apiFetch<TaskStats>("/api/dashboard/worker/stats", {
        method: "GET",
      });
      setStats(data);
    };

    loadStats();
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-muted mb-2" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-20 animate-pulse rounded-lg border bg-card" />
          <div className="h-20 animate-pulse rounded-lg border bg-card" />
          <div className="h-20 animate-pulse rounded-lg border bg-card" />
          <div className="h-20 animate-pulse rounded-lg border bg-card" />
        </div>
        <div className="h-64 animate-pulse rounded-lg border bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Worker Task Summary</CardTitle>
          <CardDescription>
            Overview of worker task execution and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-lg font-bold">
                {stats.summary.success_rate.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-lg font-bold">{stats.summary.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Successful Tasks</p>
              <p className="text-lg font-bold text-green-500">
                {stats.summary.success}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started Tasks</p>
              <p className="text-lg font-bold text-blue-500">
                {stats.summary.success}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed Tasks</p>
              <p className="text-lg font-bold text-red-500">
                {stats.summary.failure}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
              <p className="text-lg font-bold text-yellow-500">
                {stats.summary.pending}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retry Tasks</p>
              <p className="text-lg font-bold text-orange-500">
                {stats.summary.retry}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Tasks</CardTitle>
          <CardDescription>
            Most frequently executed worker tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.top_tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">
                      Task Name
                    </th>
                    <th className="text-right py-2 px-3 font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_tasks.map((task) => (
                    <tr key={task.name} className="border-b last:border-0">
                      <td className="py-2 px-3">{task.name}</td>
                      <td className="py-2 px-3 text-right">{task.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No top task data available yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TaskListTab() {
  // Filters
  const [status, setStatus] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskId, setTaskId] = useState("");
  const [limit, setLimit] = useState(50);

  // Pagination
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh
  const [refreshSeconds, setRefreshSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Detail panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      ...(status && { status }),
      ...(taskName && { task_name: taskName }),
      ...(taskId && { task_id_contains: taskId }),
      limit: String(limit),
      offset: String(offset),
    });
    const data = await apiFetch<{
      items: Array<Task>;
      total: number;
      limit: number;
      offset: number;
    } | null>(`/api/dashboard/worker/task-list?${params.toString()}`, {
      method: "GET",
    });

    if (!data) {
      setTasks([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setTasks(data.items || []);
    setTotal(data.total || 0);
    setLimit(data.limit || 50);
    setOffset(data.offset || 0);
    setLoading(false);
  }, [limit, offset, status, taskName, taskId]);

  const handleRowClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (refreshSeconds > 0) {
      timerRef.current = setInterval(fetchTasks, refreshSeconds * 1000);
    }
    fetchTasks();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshSeconds, fetchTasks]);

  // Pagination info
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Celery Task List</CardTitle>
          <CardDescription>
            View and filter all worker tasks. Click a row to inspect details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Row */}
          <div className="flex flex-wrap gap-2 mb-4 items-end">
            <div>
              <Label className="block text-xs mb-1">Status</Label>
              <select
                className="border rounded px-2 py-1"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="block text-xs mb-1">Task Name</Label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Filter by task name"
                className="w-40"
              />
            </div>
            <div>
              <Label className="block text-xs mb-1">Task ID</Label>
              <Input
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="Filter by task id"
                className="w-40"
              />
            </div>
            <div>
              <Label className="block text-xs mb-1">Limit</Label>
              <select
                className="border rounded px-2 py-1"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0); // Reset to first page when limit changes
                }}
              >
                {LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="ml-2"
              onClick={() => {
                setOffset(0);
                fetchTasks();
              }}
            >
              Apply
            </Button>
            <div className="ml-auto flex gap-2 items-center">
              <Label className="text-xs">Auto refresh</Label>
              <select
                className="border rounded px-2 py-1"
                value={refreshSeconds}
                onChange={(e) => setRefreshSeconds(Number(e.target.value))}
              >
                <option value={0}>Off</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
              <Button variant="secondary" onClick={fetchTasks} className="ml-2">
                Refresh now
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: 180 }}>Date Done</TableHead>
                  <TableHead style={{ width: 290 }}>Task Name</TableHead>
                  <TableHead style={{ width: 275 }}>Task ID</TableHead>
                  <TableHead style={{ width: 90 }}>Status</TableHead>
                  <TableHead style={{ width: 120 }}>Worker</TableHead>
                  <TableHead style={{ width: 80 }}>Retries</TableHead>
                  {/* <TableHead style={{ width: 120 }}>Queue</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="h-8 animate-pulse bg-muted rounded" />
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((item) => (
                    <TableRow
                      key={item.task_id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell>{fmtDate(item.date_done)}</TableCell>
                      <TableCell title={item.name}>{item.name}</TableCell>
                      <TableCell title={item.task_id}>
                        {item.task_id.split("-").reverse()[0]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "SUCCESS"
                              ? "success"
                              : item.status === "FAILURE"
                                ? "destructive"
                                : item.status === "PENDING"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell title={item.worker}>{item.worker}</TableCell>
                      <TableCell>{item.retries}</TableCell>
                      {/* <TableCell title={item.queue}>{item.queue}</TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {from}-{to} of {total} tasks
            </span>
            <div className="flex flex-row gap-2">
              <Button
                variant="secondary"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (offset + limit < total) setOffset(offset + limit);
                }}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans">Task Details</DialogTitle>
            <DialogDescription>
              Inspect details for task{" "}
              <span className="font-mono">{selectedTask?.task_id}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedTask ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <span className="font-semibold text-sm">Status:</span>
                    <Badge className="w-fit">{selectedTask.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <span className="font-semibold text-sm">Name:</span>
                    <span className="font-mono text-sm break-words overflow-hidden">
                      {selectedTask.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <span className="font-semibold text-sm">Date Done:</span>
                    <span className="font-mono text-sm truncate">
                      {fmtDate(selectedTask.date_done)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <span className="font-semibold text-sm">Worker:</span>
                    <span className="font-mono text-sm break-words overflow-hidden">
                      {selectedTask.worker}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <span className="font-semibold text-sm">Queue:</span>
                    <span className="font-mono text-sm break-words overflow-hidden">
                      {selectedTask.queue}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <span className="font-semibold text-sm">Retries:</span>
                    <span className="font-mono text-sm">
                      {selectedTask.retries}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-b" />
              <Tabs defaultValue="result" className="w-full">
                <TabsList>
                  <TabsTrigger className="font-sans" value="args">
                    Args
                  </TabsTrigger>
                  <TabsTrigger className="font-sans" value="kwargs">
                    Kwargs
                  </TabsTrigger>
                  <TabsTrigger className="font-sans" value="result">
                    Result
                  </TabsTrigger>
                  <TabsTrigger className="font-sans" value="traceback">
                    Traceback
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="args">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold font-sans">Args</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(pretty(selectedTask.args))
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto max-h-96 whitespace-pre-wrap break-all">
                    {pretty(selectedTask.args)}
                  </pre>
                </TabsContent>
                <TabsContent value="kwargs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold font-sans">Kwargs</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          pretty(selectedTask.kwargs),
                        )
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto max-h-96 whitespace-pre-wrap break-all">
                    {pretty(selectedTask.kwargs)}
                  </pre>
                </TabsContent>
                <TabsContent value="result">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold font-sans">Result</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          pretty(selectedTask.result),
                        )
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto max-h-96 whitespace-pre-wrap break-all">
                    {pretty(selectedTask.result)}
                  </pre>
                </TabsContent>
                <TabsContent value="traceback">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold font-sans">Traceback</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedTask.traceback || "-",
                        )
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted rounded p-3 text-xs font-mono overflow-x-auto max-h-96 whitespace-pre-wrap break-all text-red-700">
                    {selectedTask.traceback || "-"}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-8 animate-pulse bg-muted rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Top60NotificationTab() {
  const fetchTop60Teams = useCallback(async () => {
    return await apiFetch<SelectedTeams[]>(
      "/api/dashboard/worker/top-60-teams",
      {
        method: "GET",
      },
    );
  }, []);

  const [top60Teams, setTop60Teams] = useState<SelectedTeams[] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeams | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadTop60Teams = async () => {
      const teams = await fetchTop60Teams();
      setTop60Teams(teams);
    };

    loadTop60Teams();
  }, [fetchTop60Teams]);

  const handleViewMembers = (team: SelectedTeams) => {
    setSelectedTeam(team);
    setIsDialogOpen(true);
  };

  const handleNotifyLeaders = async () => {
    await apiFetch("/api/dashboard/worker/notify-top-60-leaders", {
      method: "POST",
    });
  };

  const handleNotifyAll = async () => {
    await apiFetch("/api/dashboard/worker/notify-top-60", {
      method: "POST",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Top 60 Teams</CardTitle>
          <CardDescription>
            Displays the top 60 teams based on scores with their member details
          </CardDescription>
          <div className="flex flex-row gap-4 mt-4 w-full justify-start">
            <Button onClick={handleNotifyLeaders}>Notify Leaders</Button>
            <Button onClick={handleNotifyAll}>Notify All</Button>
          </div>
        </CardHeader>
        <CardContent>
          {top60Teams ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="text-left">
                    <TableHead>Team Name</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top60Teams.map((team) => (
                    <TableRow className="text-left" key={team.id}>
                      <TableCell className="text-left">{team.name}</TableCell>
                      <TableCell>
                        {team.track === "N/A" ? (
                          <Badge variant="outline">N/A</Badge>
                        ) : (
                          <Badge>{team.track}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{team.members.length}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewMembers(team)}
                        >
                          View Members
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading teams...</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans">
              {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription>
              Track: {selectedTeam?.track} • {selectedTeam?.members.length}{" "}
              members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTeam?.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell className="text-sm">{member.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={member.is_leader ? "default" : "secondary"}
                        >
                          {member.is_leader ? "Leader" : "Member"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GithubAutomationTab() {
  const fetchAttendedTeams = useCallback(async () => {
    return await apiFetch<Team[]>("/api/dashboard/worker/attended", {
      method: "GET",
    });
  }, []);

  const [attendedTeams, setAttendedTeams] = useState<Team[] | null>(null);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [teamNameFilter, setTeamNameFilter] = useState("");
  const [memberNameFilter, setMemberNameFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTeam, setDialogTeam] = useState<Team | null>(null);

  useEffect(() => {
    const loadAttendedTeams = async () => {
      const teams = await fetchAttendedTeams();
      console.log(teams);
      setAttendedTeams(teams);
      setFilteredTeams(teams || []);
    };
    loadAttendedTeams();
  }, [fetchAttendedTeams]);

  useEffect(() => {
    if (!attendedTeams) return;
    let teams = attendedTeams;
    if (teamNameFilter.trim()) {
      teams = teams.filter((team) =>
        team.team_name
          .toLowerCase()
          .includes(teamNameFilter.trim().toLowerCase()),
      );
    }
    if (memberNameFilter.trim()) {
      teams = teams.filter((team) =>
        team.members.some((m) =>
          m.name.toLowerCase().includes(memberNameFilter.trim().toLowerCase()),
        ),
      );
    }
    if (usernameFilter.trim()) {
      teams = teams.filter((team) =>
        team.members.some((m) =>
          m.username
            .toLowerCase()
            .includes(usernameFilter.trim().toLowerCase()),
        ),
      );
    }
    setFilteredTeams(teams);
  }, [attendedTeams, teamNameFilter, memberNameFilter, usernameFilter]);

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeams(new Set(filteredTeams.map((t) => t.team_id)));
    } else {
      setSelectedTeams(new Set());
    }
  };

  const handleViewMembers = (team: Team) => {
    setDialogTeam(team);
    setIsDialogOpen(true);
  };

  const handleAutomateGithub = async () => {
    await apiFetch("/api/dashboard/worker/trigger-automation", {
      method: "POST",
      body: JSON.stringify({
        teamIds: Array.from(selectedTeams),
      }),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Attended Teams (GitHub Automation)</CardTitle>
          <CardDescription>
            Filter, select, and automate GitHub repo management for attended
            teams
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-4 w-full items-end">
            <Input
              placeholder="Filter by team name"
              value={teamNameFilter}
              onChange={(e) => setTeamNameFilter(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Filter by member name"
              value={memberNameFilter}
              onChange={(e) => setMemberNameFilter(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Filter by username"
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="w-48"
            />
            <Button
              variant="default"
              onClick={handleAutomateGithub}
              disabled={selectedTeams.size === 0}
            >
              Start Automation for {selectedTeams.size} Team(s)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {attendedTeams ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={
                          selectedTeams.size === filteredTeams.length &&
                          filteredTeams.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all teams"
                      />
                    </TableHead>
                    <TableHead>No.</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team, _idx) => (
                    <TableRow key={team.team_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTeams.has(team.team_id)}
                          onCheckedChange={() => handleSelectTeam(team.team_id)}
                          aria-label={`Select team ${team.team_name}`}
                        />
                      </TableCell>
                      <TableCell>{team.team_no}</TableCell>
                      <TableCell>{team.team_name}</TableCell>
                      <TableCell>{team.members.length}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewMembers(team)}
                        >
                          View Members
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTeams.length === 0 && (
                <div className="p-4 text-muted-foreground">No teams found.</div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Loading teams...</p>
          )}
        </CardContent>
      </Card>

      {/* Members Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans">
              {dialogTeam?.team_name}
            </DialogTitle>
            <DialogDescription>
              {dialogTeam?.members.length} members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dialogTeam?.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.username}</TableCell>
                      <TableCell className="text-sm">{member.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GithubRepoAccessTab() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCommit = async (enabled: boolean) => {
    setIsLoading(true);
    const response = confirm("Are you sure you want to enable commit access?");
    if (!response) return;

    await apiFetch("/api/dashboard/worker/toggle-commit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enabled: enabled,
      }),
    });

    setIsLoading(false);
  };

  const handleRepoPrivacy = async (makePrivate: boolean) => {
    setIsLoading(true);
    const response = confirm(
      "Are you sure you want to change the repository privacy setting?",
    );
    if (!response) return;

    await apiFetch("/api/dashboard/worker/toggle-repo-privacy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        make_private: makePrivate,
      }),
    });

    setIsLoading(false);
  };

  const handleTogglgeDataSync = async () => {
    setIsLoading(true);
    const response = confirm(
      "This will toggle the data sync for GitHub repo access. Are you sure?",
    );
    if (!response) return;

    await apiFetch("/api/dashboard/worker/toggle-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Repo Access</CardTitle>
        <CardDescription>
          Manage GitHub repository access for teams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-x-4 space-y-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Button
          onClick={async () => await handleCommit(true)}
          disabled={isLoading}
          className="order-1"
        >
          Enable Commit
        </Button>
        <Button
          variant={"destructive"}
          onClick={async () => await handleCommit(false)}
          disabled={isLoading}
          className="md:order-3 order-2 lg:order-2"
        >
          Disable Commit
        </Button>
        <Button
          onClick={async () => await handleRepoPrivacy(true)}
          disabled={isLoading}
          className="md:order-2 order-3 lg:order-3"
        >
          Make Repo Private
        </Button>
        <Button
          variant={"destructive"}
          onClick={async () => await handleRepoPrivacy(false)}
          disabled={isLoading}
          className="order-4"
        >
          Make Repo Public
        </Button>
        <Button
          variant={"secondary"}
          onClick={handleTogglgeDataSync}
          disabled={isLoading}
          className="order-5 col-span-full"
        >
          Toggle Data Sync
        </Button>
      </CardContent>
    </Card>
  );
}
