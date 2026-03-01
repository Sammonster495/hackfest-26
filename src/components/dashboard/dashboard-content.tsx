"use client";

import type { Session } from "next-auth";
import { Suspense } from "react";
import { AdminDashboard } from "~/components/dashboard/admin/admin-dashboard";
import { DashboardTabs } from "~/components/dashboard/dashboard-tabs";
import { useDashboardPermissions } from "~/components/dashboard/permissions-context";
import { TeamsTab } from "../tabs";
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
