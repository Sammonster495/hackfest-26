"use client";

import type { Session } from "next-auth";
import { Suspense, useEffect, useState } from "react";
import { AdminDashboard } from "~/components/dashboard/admin/admin-dashboard";
import { DashboardTabs } from "~/components/dashboard/dashboard-tabs";
import { useDashboardPermissions } from "~/components/dashboard/permissions-context";
import { TeamsTab } from "../tabs";
import { CollegesTab } from "./tabs/colleges/CollegesTab";
import { EvaluatorTab } from "./tabs/Evaluator";
import { FinalJudgeTab } from "./tabs/FinalJudge";
import { JudgeTab } from "./tabs/Judge";
import { ManageEventsTab } from "./tabs/ManageEvents";
import { MentorTab } from "./tabs/Mentor";
import { SelectorTab } from "./tabs/Selector";

type DashboardContentProps = {
  session: Session;
};

export function DashboardContent({ session }: DashboardContentProps) {
  const permissions = useDashboardPermissions();
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = () => {
      if (permissions.isAdmin) {
        fetch("/api/dashboard/college-requests/count")
          .then((res) => res.json())
          .then((data) => {
            if (typeof data.count === "number") {
              setPendingRequestsCount(data.count);
            }
          })
          .catch(console.error);
      }
    };

    fetchCounts();
    window.addEventListener("invalidate-counts-cache", fetchCounts);
    return () => window.removeEventListener("invalidate-counts-cache", fetchCounts);
  }, [permissions.isAdmin]);

  const {
    isAdmin,
    canViewAllTeams,
    canScoreSubmissions,
    canRemarkSubmissions,
    canPromoteSelection,
    canViewSelection,
    canViewTop60,
    canViewResults,
    canManageEvents,
  } = permissions;

  const tabs = [
    {
      id: "admin",
      label: "Admin",
      hasAccess: isAdmin,
      content: <AdminDashboard />,
    },
    {
      id: "teams",
      label: "Teams",
      hasAccess: canViewAllTeams,
      content: <TeamsTab />,
    },
    {
      id: "colleges",
      label: (
        <span className="flex items-center gap-2">
          Colleges
          {pendingRequestsCount > 0 && (
            <span className="bg-red-500 text-white min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5">
              {pendingRequestsCount}
            </span>
          )}
        </span>
      ),
      hasAccess: isAdmin, // or specific permission
      content: <CollegesTab />,
    },
    {
      id: "events",
      label: "Events",
      hasAccess: canManageEvents,
      content: <ManageEventsTab session={session} />,
    },
    {
      id: "evaluator",
      label: "Evaluator",
      hasAccess: canScoreSubmissions && canViewAllTeams,
      content: <EvaluatorTab />,
    },
    {
      id: "selector",
      label: "Selection",
      hasAccess: canPromoteSelection && canViewSelection,
      content: <SelectorTab />,
    },
    {
      id: "judge",
      label: "Judge",
      hasAccess: canScoreSubmissions && canViewTop60,
      content: <JudgeTab />,
    },
    {
      id: "finalJudge",
      label: "Final Judge",
      hasAccess: canScoreSubmissions && canViewResults,
      content: <FinalJudgeTab />,
    },
    {
      id: "mentor",
      label: "Mentor",
      hasAccess: canRemarkSubmissions,
      content: <MentorTab />,
    },
  ];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <DashboardTabs tabs={tabs} defaultTab={isAdmin ? "admin" : undefined} />
    </Suspense>
  );
}
