"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PermissionGate,
  useDashboardPermissions,
  useDashboardUser,
} from "~/components/dashboard/permissions-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { IdeaRoundPanel } from "./submissions/IdeaRoundPanel";
import { IdeaRoundSettingsPanel } from "./submissions/IdeaRoundSettingsPanel";
import { LeaderboardPanel } from "./submissions/LeaderboardPanel";
import type { IdeaAllocation } from "./submissions/types";

export function SubmissionsTab() {
  const permissions = useDashboardPermissions();
  const dashboardUser = useDashboardUser();
  const isEvaluator = useMemo(
    () =>
      dashboardUser.roles.some((role) =>
        role.permissions.some(
          (permission) => permission.key === "submission:score",
        ),
      ),
    [dashboardUser.roles],
  );

  const [activeTab, setActiveTab] = useState<string>("LEADERBOARD");
  const [allocations, setAllocations] = useState<IdeaAllocation[]>([]);
  const [_loadingAllocations, setLoadingAllocations] = useState(true);

  const fetchAllocations = async () => {
    if (!isEvaluator) {
      setLoadingAllocations(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/idea-rounds/my-allocations");
      if (res.ok) {
        const data = await res.json();
        setAllocations(data);

        if (data.length > 0 && activeTab === "LEADERBOARD") {
          setActiveTab(data[0].roundId);
        }
      }
    } catch (e) {
      console.error("Failed to load allocations", e);
    } finally {
      setLoadingAllocations(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Initialize ONCE
  useEffect(() => {
    void fetchAllocations();
  }, [isEvaluator]);

  const uniqueRounds = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const a of allocations) {
      if (!map.has(a.roundId)) {
        map.set(a.roundId, { id: a.roundId, name: a.roundName });
      }
    }
    return Array.from(map.values());
  }, [allocations]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Submissions</h2>
        <p className="text-muted-foreground">
          Review submissions, evaluate ideas, and track leaderboard standings.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="mb-4 flex flex-wrap h-auto gap-2 p-1">
          {uniqueRounds.map((r) => (
            <TabsTrigger key={r.id} value={r.id} className="min-w-24">
              {r.name}
            </TabsTrigger>
          ))}
          <PermissionGate beAdmin>
            <TabsTrigger value="LEADERBOARD">Leaderboard</TabsTrigger>
            <TabsTrigger value="SETTINGS">Settings</TabsTrigger>
          </PermissionGate>
        </TabsList>

        {uniqueRounds.map((r) => (
          <TabsContent key={r.id} value={r.id}>
            <IdeaRoundPanel
              allocations={allocations.filter((a) => a.roundId === r.id)}
              onScoresSaved={fetchAllocations}
            />
          </TabsContent>
        ))}

        {permissions.beAdmin && (
          <TabsContent value="LEADERBOARD">
            <LeaderboardPanel />
          </TabsContent>
        )}

        {permissions.beAdmin && (
          <TabsContent value="SETTINGS">
            <IdeaRoundSettingsPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
