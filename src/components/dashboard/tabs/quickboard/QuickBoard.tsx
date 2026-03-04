"use client";

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
};

type QuickStats = {
  totalTeams: number;
  totalUsers: number;
  totalParticipants: number;
  uniqueTotalColleges: number;
  uniqueTotalStates: number;
  uniqueConfirmedColleges: number;
  uniqueConfirmedStates: number;
  confirmedTeams: number;
  confirmedParticipants: number;
  ideaSubmissions: number;
};

type StateStat = {
  state: string | null;
  totalTeams: number;
  totalParticipants: number;
};

type CollegeRanking = {
  college: string | null;
  totalTeams: number;
  totalParticipants: number;
};

type CollegeBreakdown = {
  college: string | null;
  state: string | null;
  totalTeams: number;
  confirmedTeams: number;
  ideaSubmissions: number;
};

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickboardTab() {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [statesStats, setStatesStats] = useState<StateStat[]>([]);
  const [statesStatsTotal, setStatesStatsTotal] = useState<StateStat[]>([]);
  const [collegeRankings, setCollegeRankings] = useState<CollegeRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [collegesBreakdown, setCollegesBreakdown] = useState<
    CollegeBreakdown[]
  >([]);
  const [collegeBreakdownTotal, setCollegeBreakdownTotal] = useState(0);
  const [uniqueStates, setUniqueStates] = useState<string[]>([]);
  const [isCollegeLoading, setIsCollegeLoading] = useState(false);

  const [showConfirmedStates, setShowConfirmedStates] = useState(true);
  const [collegeStateFilter, setCollegeStateFilter] = useState("all");
  const [showOnlyWithIdeas, setShowOnlyWithIdeas] = useState(false);
  const [collegePage, setCollegePage] = useState(0);

  const COLLEGES_PER_PAGE = 10;

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setQuickStats(data.quickStats);
        setStatesStats(data.statesConfirmedStats);
        setStatesStatsTotal(data.statesTotalStats);
        setCollegeRankings(data.collegeRankings);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchCollegeBreakdown() {
      setIsCollegeLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(collegePage),
          limit: String(COLLEGES_PER_PAGE),
        });
        if (collegeStateFilter !== "all") {
          params.set("state", collegeStateFilter);
        }
        if (showOnlyWithIdeas) {
          params.set("ideaOnly", "true");
        }

        const response = await fetch(
          `/api/dashboard/stats/college-breakdown?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch college breakdown");
        }
        const result = await response.json();
        setCollegesBreakdown(result.data);
        setCollegeBreakdownTotal(result.total);
        setUniqueStates(result.states);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load college breakdown");
      } finally {
        setIsCollegeLoading(false);
      }
    }

    fetchCollegeBreakdown();
  }, [collegePage, collegeStateFilter, showOnlyWithIdeas]);

  const activeStatesData = showConfirmedStates ? statesStats : statesStatsTotal;

  const totalCollegePages = Math.ceil(
    collegeBreakdownTotal / COLLEGES_PER_PAGE,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-muted mb-2" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
          <div className="h-32 animate-pulse rounded-lg border bg-card" />
        </div>
        <div className="h-64 animate-pulse rounded-lg border bg-card" />
        <div className="h-64 animate-pulse rounded-lg border bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quickboard</h2>
        <p className="text-muted-foreground">Overview of Hackfest Stats</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users Accounts"
          value={quickStats?.totalUsers ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Teams registered"
          value={quickStats?.totalTeams ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Participants registered"
          value={quickStats?.totalParticipants ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unique Colleges (Total)"
          value={quickStats?.uniqueTotalColleges ?? 0}
          description="Colleges from which teams have registered"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Unique States (Total)"
          value={quickStats?.uniqueTotalStates ?? 0}
          description="States from which teams have registered"
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          title="Unique Colleges (Confirmed)"
          value={quickStats?.uniqueConfirmedColleges ?? 0}
          description="Colleges from which teams have registered"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Unique States (Confirmed)"
          value={quickStats?.uniqueConfirmedStates ?? 0}
          description="States from which teams have registered"
          icon={<MapPin className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Confirmed Teams"
          value={quickStats?.confirmedTeams ?? 0}
          description="Teams that have confirmed participation"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Confirmed Participants"
          value={quickStats?.confirmedParticipants ?? 0}
          description="Participants that have confirmed participation"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Idea Submissions"
          value={quickStats?.ideaSubmissions ?? 0}
          description="Teams that have submitted their ideas"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>State Analytics</CardTitle>
              <CardDescription>
                State-wise breakdown of registrations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="state-toggle"
                className="text-sm text-muted-foreground"
              >
                {showConfirmedStates ? "Confirmed" : "Total"}
              </Label>
              <Switch
                id="state-toggle"
                checked={showConfirmedStates}
                onCheckedChange={setShowConfirmedStates}
                size="sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeStatesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">State</th>
                    <th className="text-right py-2 px-3 font-medium">Teams</th>
                    <th className="text-right py-2 px-3 font-medium">
                      Participants
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeStatesData.map((state) => (
                    <tr
                      key={state.state ?? "unknown"}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 px-3">{state.state}</td>
                      <td className="py-2 px-3 text-right">
                        {state.totalTeams}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {state.totalParticipants}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No state data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>College Analytics</CardTitle>
              <CardDescription className="mt-2">
                College-wise breakdown of team registrations
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={collegeStateFilter}
                  onValueChange={(val) => {
                    setCollegeStateFilter(val);
                    setCollegePage(0);
                  }}
                >
                  <SelectTrigger className="w-[180px]" size="sm">
                    <SelectValue placeholder="Filter by state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {uniqueStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="idea-toggle"
                  className="text-sm text-muted-foreground"
                >
                  Idea Submitted
                </Label>
                <Switch
                  id="idea-toggle"
                  checked={showOnlyWithIdeas}
                  onCheckedChange={(val) => {
                    setShowOnlyWithIdeas(val);
                    setCollegePage(0);
                  }}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isCollegeLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : collegesBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">College</th>
                    <th className="text-right py-2 px-3 font-medium">
                      Confirmed Teams
                    </th>
                    <th className="text-right py-2 px-3 font-medium">
                      Unconfirmed Teams
                    </th>
                    <th className="text-right py-2 px-3 font-medium">
                      Idea Submissions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collegesBreakdown.map((entry) => (
                    <tr
                      key={entry.college ?? "unknown"}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 px-3">{entry.college}</td>
                      <td className="py-2 px-3 text-right">
                        {entry.confirmedTeams}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {entry.totalTeams - entry.confirmedTeams}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {entry.ideaSubmissions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalCollegePages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {collegePage * COLLEGES_PER_PAGE + 1}–
                    {Math.min(
                      (collegePage + 1) * COLLEGES_PER_PAGE,
                      collegeBreakdownTotal,
                    )}{" "}
                    of {collegeBreakdownTotal} colleges
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCollegePage((p) => Math.max(0, p - 1))}
                      disabled={collegePage === 0}
                      className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {collegePage + 1} / {totalCollegePages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCollegePage((p) =>
                          Math.min(totalCollegePages - 1, p + 1),
                        )
                      }
                      disabled={collegePage >= totalCollegePages - 1}
                      className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No college data available
                {collegeStateFilter !== "all" && " for this state"}
                {showOnlyWithIdeas && " with idea submissions"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Colleges</CardTitle>
          <CardDescription>Colleges ranked by selected teams</CardDescription>
        </CardHeader>
        <CardContent>
          {collegeRankings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">College</th>
                    <th className="text-right py-2 px-3 font-medium">Teams</th>
                    <th className="text-right py-2 px-3 font-medium">
                      Participants
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collegeRankings.map((college) => (
                    <tr
                      key={college.college ?? "unknown"}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 px-3">{college.college}</td>
                      <td className="py-2 px-3 text-right">
                        {college.totalTeams}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {college.totalParticipants}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No college ranking data available yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
