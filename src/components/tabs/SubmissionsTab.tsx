"use client";

import { useMemo, useState } from "react";
import {
  useDashboardPermissions,
  useDashboardUser,
} from "~/components/dashboard/permissions-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { EvaluatorSettingsPanel } from "./submissions/EvaluatorSettingsPanel";
import { FloatingPdfWindows } from "./submissions/FloatingPdfWindows";
import { LeaderboardPanel } from "./submissions/LeaderboardPanel";
import { RoundSubmissionsPanel } from "./submissions/RoundSubmissionsPanel";
import type { PdfWindow, SubmissionItem } from "./submissions/types";

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

  const [activeTab, setActiveTab] = useState("ROUND_1");
  const [windows, setWindows] = useState<PdfWindow[]>([]);

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

  const openPdfWindow = (submission: SubmissionItem) => {
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
        <TabsList>
          <TabsTrigger value="ROUND_1">Round 1</TabsTrigger>
          <TabsTrigger value="ROUND_2">Round 2</TabsTrigger>
          <TabsTrigger value="LEADERBOARD">Leaderboard</TabsTrigger>
          {permissions.isAdmin && (
            <TabsTrigger value="SETTINGS">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ROUND_1">
          <RoundSubmissionsPanel
            round="ROUND_1"
            canScore={isEvaluator}
            onOpenPdf={openPdfWindow}
          />
        </TabsContent>

        <TabsContent value="ROUND_2">
          <RoundSubmissionsPanel
            round="ROUND_2"
            canScore={isEvaluator}
            onOpenPdf={openPdfWindow}
          />
        </TabsContent>

        <TabsContent value="LEADERBOARD">
          <LeaderboardPanel />
        </TabsContent>

        {permissions.isAdmin && (
          <TabsContent value="SETTINGS">
            <EvaluatorSettingsPanel />
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
