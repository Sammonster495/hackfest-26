"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

type TabConfig = {
  id: string;
  label: string;
  hasAccess: boolean;
  content: React.ReactNode;
};

type DashboardTabsProps = {
  tabs: TabConfig[];
  defaultTab?: string;
  storageKey?: string;
};

export function DashboardTabs({
  tabs,
  defaultTab,
  storageKey = "dashboardActiveTab",
}: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  const accessibleTabs = tabs.filter((tab) => tab.hasAccess);

  const getInitialTab = (): string => {
    const urlTab = searchParams.get("tab");
    if (urlTab && accessibleTabs.some((t) => t.id === urlTab)) {
      return urlTab;
    }

    if (typeof window !== "undefined") {
      const storedTab = localStorage.getItem(storageKey);
      if (storedTab && accessibleTabs.some((t) => t.id === storedTab)) {
        return storedTab;
      }
    }

    return defaultTab ?? accessibleTabs[0]?.id ?? "";
  };

  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
    setActiveTab(getInitialTab());
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, value);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  if (!isClient || accessibleTabs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start mb-6 h-auto flex-wrap gap-1 bg-muted/50 p-1">
        {accessibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {accessibleTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
