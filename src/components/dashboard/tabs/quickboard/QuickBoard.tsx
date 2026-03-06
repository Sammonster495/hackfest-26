"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CollegeAnalytics } from "./CollegeAnalytics";
import { type StateStat, StatesAnalytics } from "./StateAnalytics";
import { type QuickStats, Stats } from "./Stats";

type CollegeRanking = {
  college: string | null;
  totalTeams: number;
  totalParticipants: number;
};

export function QuickboardTab() {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [statesStats, setStatesStats] = useState<StateStat[]>([]);
  const [statesStatsTotal, setStatesStatsTotal] = useState<StateStat[]>([]);
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
      <Stats data={quickStats} />
      <StatesAnalytics
        statesStatsTotal={statesStatsTotal}
        statesStatsConfirmed={statesStats}
      />
      <CollegeAnalytics />
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
