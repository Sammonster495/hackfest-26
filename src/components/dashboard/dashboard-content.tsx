"use client";

import type { Session } from "next-auth";
import { Suspense } from "react";
import { dashboardFeatureTabs } from "~/components/dashboard/dashboard-tab-config";
import { DashboardTabs } from "~/components/dashboard/dashboard-tabs";
import { hasPermission } from "~/lib/auth/permissions";
import {
  AllocationsTab,
  AttendanceTab,
  DashboardUsersTab,
  MealsTab,
  PaymentsTab,
  ResultsTab,
  RolesTab,
  SelectionsTab,
  SettingsTab,
  SubmissionsTab,
  TeamsTab,
} from "../tabs";
import { CollegesTab } from "./tabs/colleges/CollegesTab";
import { ManageEventsTab } from "./tabs/ManageEvents";
import { QuickboardTab } from "./tabs/QuickBoard";

type DashboardContentProps = {
  session: Session;
};

export function DashboardContent({ session }: DashboardContentProps) {
  const { dashboardUser } = session;
  const userRoles = dashboardUser.roles.map((r) => r.name);
  const _isAdmin = userRoles.includes("ADMIN");

  const baseTabs = [
    { id: "quickboard", content: <QuickboardTab /> },
    { id: "teams", content: <TeamsTab /> },
    { id: "colleges", content: <CollegesTab /> },
    { id: "payments", content: <PaymentsTab /> },
    { id: "submissions", content: <SubmissionsTab /> },
    { id: "selection", content: <SelectionsTab /> },
    { id: "results", content: <ResultsTab /> },
    { id: "attendance", content: <AttendanceTab /> },
    { id: "meals", content: <MealsTab /> },
    { id: "allocations", content: <AllocationsTab /> },
    { id: "roles", content: <RolesTab /> },
    { id: "users", content: <DashboardUsersTab /> },
    { id: "settings", content: <SettingsTab /> },
    { id: "events", content: <ManageEventsTab session={session} /> },
  ];

  const checkTabAccess = (config: (typeof dashboardFeatureTabs)[0]) => {
    if (_isAdmin) return true;
    if (!config.permissions || config.permissions.length === 0) return true;

    if (config.requireAll) {
      return config.permissions.every((p) => hasPermission(dashboardUser, p));
    } else {
      return config.permissions.some((p) => hasPermission(dashboardUser, p));
    }
  };

  const tabs = dashboardFeatureTabs.map((config) => {
    const baseTab = baseTabs.find((t) => t.id === config.id);
    return {
      id: config.id,
      label: config.label,
      hasAccess: checkTabAccess(config),
      content: baseTab?.content,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Your Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {dashboardUser.name}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          </div>
        }
      >
        <DashboardTabs tabs={tabs} defaultTab="quickboard" />
      </Suspense>
    </div>
  );
}
