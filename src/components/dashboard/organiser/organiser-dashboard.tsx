"use client";

import { useEffect, useState } from "react";
import {
  AllocationsTab,
  AttendanceTab,
  MealsTab,
  ResultsTab,
  RolesTab,
  SelectionsTab,
  SettingsTab,
  SubmissionsTab,
  TeamsTab,
} from "~/components/tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { QuickboardTab } from "./quickboard-tab";

type SubTabConfig = {
  id: string;
  label: string;
  component: React.ReactNode;
};

const SUB_TABS: SubTabConfig[] = [
  {
    id: "quickboard",
    label: "Quickboard",
    component: <QuickboardTab />,
  },
  {
    id: "teams",
    label: "Teams",
    component: <TeamsTab />,
  },
  {
    id: "submissions",
    label: "Submissions",
    component: <SubmissionsTab />,
  },
  {
    id: "selection",
    label: "Selection",
    component: <SelectionsTab />,
  },
  {
    id: "results",
    label: "Results",
    component: <ResultsTab />,
  },
  {
    id: "attendance",
    label: "Attendance",
    component: <AttendanceTab />,
  },
  {
    id: "meals",
    label: "Meals",
    component: <MealsTab />,
  },
  {
    id: "allocations",
    label: "Allocations",
    component: <AllocationsTab />,
  },
  {
    id: "roles",
    label: "Roles",
    component: <RolesTab />,
  },
  {
    id: "settings",
    label: "Settings",
    component: <SettingsTab />,
  },
];

export function OrganiserDashboard() {
  const [activeTab, setActiveTab] = useState("quickboard");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("adminActiveTab");
    if (stored && SUB_TABS.some((t) => t.id === stored)) {
      setActiveTab(stored);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("adminActiveTab", value);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Full system access and management
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full justify-between h-auto flex-wrap gap-1 bg-muted/50 p-1">
          {SUB_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SUB_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
