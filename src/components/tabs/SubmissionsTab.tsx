"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PermissionGate,
  useDashboardPermissions,
  useDashboardUser,
} from "~/components/dashboard/permissions-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { FloatingPdfWindows } from "./submissions/FloatingPdfWindows";
import { IdeaRoundPanel } from "./submissions/IdeaRoundPanel";
import { IdeaRoundSettingsPanel } from "./submissions/IdeaRoundSettingsPanel";
import { LeaderboardPanel } from "./submissions/LeaderboardPanel";
import type { IdeaAllocation, PdfWindow } from "./submissions/types";

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
  const [windows, setWindows] = useState<PdfWindow[]>([]);
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

  const bringToFront = (id: string) => {
    setWindows((prev) => {
      const maxZ = prev.reduce((acc, item) => Math.max(acc, item.zIndex), 0);
      return prev.map((item) =>
        item.id === id
          ? {
              ...item,
              zIndex: maxZ + 1,
            }
          : item,
      );
    });
  };

  const openPdfWindow = (submission: {
    id: string;
    teamName: string;
    trackName: string;
    pdfUrl: string;
  }) => {
    setWindows((prev) => {
      const existing = prev.find((item) => item.id === submission.id);
      if (existing) {
        const maxZ = prev.reduce((acc, item) => Math.max(acc, item.zIndex), 0);
        return prev.map((item) =>
          item.id === submission.id ? { ...item, zIndex: maxZ + 1 } : item,
        );
      }

      const maxZ = prev.reduce((acc, item) => Math.max(acc, item.zIndex), 0);

      return [
        ...prev,
        {
          id: submission.id,
          title: `${submission.teamName} - ${submission.trackName}`,
          url: submission.pdfUrl,
          x: 80 + (prev.length % 5) * 24,
          y: 100 + (prev.length % 5) * 24,
          width: 640,
          height: 460,
          zIndex: maxZ + 1,
        },
      ];
    });
  };

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
              onOpenPdf={openPdfWindow}
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

      <FloatingPdfWindows
        windows={windows}
        onClose={(id) =>
          setWindows((prev) => prev.filter((item) => item.id !== id))
        }
        onFocus={bringToFront}
        onMove={(id, x, y) =>
          setWindows((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    x,
                    y,
                  }
                : item,
            ),
          )
        }
        onResize={(id, width, height) =>
          setWindows((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    width,
                    height,
                  }
                : item,
            ),
          )
        }
      />
    </div>
  );
}
