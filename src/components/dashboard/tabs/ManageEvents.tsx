"use client";

import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import { hasPermission } from "~/lib/auth/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import type { SubTabConfig } from "../admin/admin-dashboard";
import MarkAttendanceTab from "../events/attendance";
import CreateEventTab from "../events/create-event";
import EventListTab from "../events/event-list";
import UpdateEventTab from "../events/update-event";

export function ManageEventsTab({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const SUB_TABS: ({ permission: string } & SubTabConfig)[] = [
    {
      id: "all",
      label: "All Events",
      permission: "event:manage",
      component: null,
    },
    {
      id: "assigned",
      label: "Assigned",
      permission: "event:manage",
      component: null,
    },
    {
      id: "create",
      permission: "event:manage",
      label: "Create",
      component: null,
    },
    {
      id: "update",
      permission: "event:manage",
      label: "Update",
      component: null,
    },
    {
      id: "attendance",
      permission: "event:manage",
      label: "Mark Attendance",
      component: null,
    },
  ];

  const validTabIds = SUB_TABS.map((tab) => tab.id);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("manageEventsActiveTab");
    if (stored && validTabIds.includes(stored)) {
      setActiveTab(stored);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("manageEventsActiveTab", value);
  };

  const handleNavigateToEdit = (eventId: string) => {
    setSelectedEventId(eventId);
    handleTabChange("update");
  };

  const handleNavigateToAttendance = (eventId: string) => {
    setSelectedEventId(eventId);
    handleTabChange("attendance");
  };

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "all":
        return (
          <EventListTab
            assigned={false}
            onEdit={handleNavigateToEdit}
            onAttendance={handleNavigateToAttendance}
            session={session}
          />
        );
      case "assigned":
        return (
          <EventListTab
            assigned={true}
            onEdit={handleNavigateToEdit}
            onAttendance={handleNavigateToAttendance}
            session={session}
          />
        );
      case "create":
        return <CreateEventTab setTab={handleTabChange} />;
      case "update":
        return (
          <UpdateEventTab setTab={handleTabChange} eventId={selectedEventId} />
        );
      case "attendance":
        return (
          <MarkAttendanceTab
            setTab={handleTabChange}
            eventId={selectedEventId}
          />
        );
      default:
        return null;
    }
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
        <h2 className="text-3xl font-bold tracking-tight">Manage Events</h2>
        <p className="text-muted-foreground">
          Manage events and schedules for the hackathon
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-fit justify-between h-auto flex-wrap gap-1 bg-muted/50 p-1">
          {SUB_TABS.map((tab) => {
            return (
              hasPermission(session.dashboardUser, tab.permission) && (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              )
            );
          })}
        </TabsList>

        {SUB_TABS.map((tab) => {
          return (
            hasPermission(session.dashboardUser, tab.permission) && (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                {activeTab === tab.id && renderTabContent(tab.id)}
              </TabsContent>
            )
          );
        })}
      </Tabs>
    </div>
  );
}
