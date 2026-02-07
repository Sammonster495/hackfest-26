"use client";

import { Building2, CheckCircle2, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
};

type QuickStats = {
  totalTeams: number;
  totalParticipants: number;
  uniqueColleges: number;
  uniqueStates: number;
  confirmedTeams: number;
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
  const [collegeRankings, setCollegeRankings] = useState<CollegeRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setQuickStats(data.quickStats);
        setStatesStats(data.statesStats);
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Teams"
          value={quickStats?.totalTeams ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Participants"
          value={quickStats?.totalParticipants ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Unique Colleges"
          value={quickStats?.uniqueColleges ?? 0}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Unique States"
          value={quickStats?.uniqueStates ?? 0}
          icon={<MapPin className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Confirmed Teams"
          value={quickStats?.confirmedTeams ?? 0}
          description="Teams that have confirmed participation"
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
          <CardTitle>College Analytics</CardTitle>
          <CardDescription>
            State-wise breakdown of registrations and colleges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statesStats.length > 0 ? (
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
                  {statesStats.map((state) => (
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
                No college data available
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
