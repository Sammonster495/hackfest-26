"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CollegeRequestsTable } from "../../tables/colleges/college-requests-table";
import { CollegesTable } from "../../tables/colleges/colleges-table";

export function CollegesTab() {
  const [activeTab, setActiveTab] = useState("all-colleges");
  const [counts, setCounts] = useState({
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  });
  const [collegesCount, setCollegesCount] = useState(0);

  const fetchAllCounts = () => {
    fetch("/api/dashboard/college-requests/count")
      .then((res) => res.json())
      .then((data) => {
        if (data.counts) setCounts(data.counts);
        if (typeof data.collegesCount === "number")
          setCollegesCount(data.collegesCount);
      })
      .catch(console.error);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    fetchAllCounts();
    window.addEventListener("invalidate-counts-cache", fetchAllCounts);
    window.addEventListener("invalidate-colleges-cache", fetchAllCounts);
    return () => {
      window.removeEventListener("invalidate-counts-cache", fetchAllCounts);
      window.removeEventListener("invalidate-colleges-cache", fetchAllCounts);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Colleges</h2>
            {counts.Pending > 0 && (
              <span className="bg-red-500 text-white min-w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold px-2 animate-pulse">
                {counts.Pending}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            View and manage colleges and pending addition requests.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start mb-6 h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger
            value="all-colleges"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
          >
            All Colleges ({collegesCount})
          </TabsTrigger>
          <TabsTrigger
            value="college-requests"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 flex items-center gap-2"
          >
            College Requests
            {counts.Pending > 0 && (
              <span className="bg-red-500 text-white min-w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1">
                {counts.Pending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-colleges" className="mt-0">
          <CollegesTable />
        </TabsContent>

        <TabsContent value="college-requests" className="mt-0 space-y-4">
          <CollegeRequestsSubTabs counts={counts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CollegeRequestsSubTabs({
  counts,
}: {
  counts: { Pending: number; Approved: number; Rejected: number };
}) {
  const [subTab, setSubTab] = useState<"Pending" | "Approved" | "Rejected">(
    "Pending",
  );
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (
      !hasInitialized &&
      counts.Pending === 0 &&
      (counts.Approved > 0 || counts.Rejected > 0)
    ) {
      setSubTab("Approved");
      setHasInitialized(true);
    } else if (counts.Pending > 0) {
      setHasInitialized(true);
    }
  }, [counts, hasInitialized]);

  return (
    <Tabs
      value={subTab}
      onValueChange={(v) => setSubTab(v as "Pending" | "Approved" | "Rejected")}
      className="w-full"
    >
      <TabsList className="justify-start mb-4 bg-muted/30">
        <TabsTrigger value="Pending">
          Pending ({counts.Pending || 0})
        </TabsTrigger>
        <TabsTrigger value="Approved">
          Approved ({counts.Approved || 0})
        </TabsTrigger>
        <TabsTrigger value="Rejected">
          Rejected ({counts.Rejected || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="Pending" className="mt-0">
        <CollegeRequestsTable statusMode="Pending" />
      </TabsContent>
      <TabsContent value="Approved" className="mt-0">
        <CollegeRequestsTable statusMode="Approved" />
      </TabsContent>
      <TabsContent value="Rejected" className="mt-0">
        <CollegeRequestsTable statusMode="Rejected" />
      </TabsContent>
    </Tabs>
  );
}
