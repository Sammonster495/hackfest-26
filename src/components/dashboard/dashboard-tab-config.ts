export type FeatureTabConfig = {
  id: string;
  label: string;
  requireAll?: boolean;
  permissions?: string[];
};

export const dashboardFeatureTabs: FeatureTabConfig[] = [
  {
    id: "quickboard",
    label: "Quickboard",
    permissions: ["admin:access"],
  },
  {
    id: "teams",
    label: "Teams",
    permissions: ["team:view_all"],
  },
  {
    id: "participants",
    label: "Participants",
    permissions: ["team:view_all"],
  },
  {
    id: "colleges",
    label: "Colleges",
    permissions: ["colleges:manage"],
  },
  {
    id: "payments",
    label: "Payments",
    permissions: ["payment:manage", "admin:access"],
  },
  {
    id: "submissions",
    label: "Submission",
    permissions: ["submission:score"],
  },
  {
    id: "selection",
    label: "Selection",
    permissions: ["selection:promote", "selection:view"],
    requireAll: true,
  },
  {
    id: "results",
    label: "Results",
    permissions: ["results:view"],
  },
  {
    id: "attendance",
    label: "Attendance",
    permissions: ["attendance:mark"],
  },
  {
    id: "meals",
    label: "Meals",
    permissions: ["meals:mark"],
  },
  {
    id: "allocations",
    label: "Allocations",
    permissions: ["allocations:manage"],
  },
  {
    id: "roles",
    label: "Roles",
    permissions: ["admin:access"],
  },
  {
    id: "users",
    label: "Users",
    permissions: ["admin:access"],
  },
  {
    id: "settings",
    label: "Settings",
    permissions: ["admin:access"],
  },
  {
    id: "events",
    label: "Events",
    permissions: ["event:manage"],
  },
  {
    id: "judge-setup",
    label: "Judge Setup",
    permissions: ["roles:manage"],
  },
  {
    id: "mentor-setup",
    label: "Mentor Setup",
    permissions: ["roles:manage"],
  },
];
