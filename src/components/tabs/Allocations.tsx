"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DormsSubTab } from "./allocations/DormsSubTab";
import { LabsSubTab } from "./allocations/LabsSubTab";

const SUB_TABS = [
  { id: "dorms", label: "Dorms" },
  { id: "labs", label: "Labs" },
] as const;

type SubTabId = (typeof SUB_TABS)[number]["id"];

export function AllocationsTab() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const raw = searchParams.get("alloc");
  const activeSubTab: SubTabId = raw === "labs" ? "labs" : "dorms";

  const setActiveSubTab = (id: SubTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("alloc", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Allocations</h2>
        <p className="text-muted-foreground">Manage dorms and labs for selected teams</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 border-b">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "dorms" && <DormsSubTab />}
      {activeSubTab === "labs" && <LabsSubTab />}
    </div>
  );
}
