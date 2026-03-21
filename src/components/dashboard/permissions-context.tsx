"use client";

import { createContext, type ReactNode, useContext } from "react";
import {
  hasPermission as checkPermission,
  isAdmin,
} from "~/lib/auth/permissions";

export type DashboardPermissions = {
  beAdmin: boolean;
  isAdmin: boolean;
  canManageSettings: boolean;
  canManageRoles: boolean;
  canViewAllTeams: boolean;
  canViewTop60: boolean;
  canScoreSubmissions: boolean;
  canRemarkSubmissions: boolean;
  canPromoteSelection: boolean;
  canViewSelection: boolean;
  canMarkAttendance: boolean;
  canViewResults: boolean;
  canManageEvents: boolean;
  canViewTeamDetails: boolean;
  canViewColleges: boolean;
};

type DashboardUser = {
  roles: Array<{
    name: string;
    permissions: Array<{ key: string }>;
  }>;
};

type PermissionsContextValue = {
  permissions: DashboardPermissions;
  dashboardUser: DashboardUser;
};

const DashboardPermissionsContext =
  createContext<PermissionsContextValue | null>(null);

export function DashboardPermissionsProvider({
  permissions,
  dashboardUser,
  children,
}: {
  permissions: DashboardPermissions;
  dashboardUser: DashboardUser;
  children: ReactNode;
}) {
  return (
    <DashboardPermissionsContext.Provider
      value={{ permissions, dashboardUser }}
    >
      {children}
    </DashboardPermissionsContext.Provider>
  );
}

export function useDashboardPermissions(): DashboardPermissions {
  const ctx = useContext(DashboardPermissionsContext);
  if (!ctx) {
    throw new Error(
      "useDashboardPermissions must be used within DashboardPermissionsProvider",
    );
  }
  return ctx.permissions;
}

export function useHasPermission(permissionKey: string): boolean {
  const ctx = useContext(DashboardPermissionsContext);
  if (!ctx) {
    throw new Error(
      "useHasPermission must be used within DashboardPermissionsProvider",
    );
  }
  return checkPermission(ctx.dashboardUser, permissionKey);
}

export function useDashboardUser() {
  const ctx = useContext(DashboardPermissionsContext);
  if (!ctx) {
    throw new Error(
      "useDashboardUser must be used within DashboardPermissionsProvider",
    );
  }

  return ctx.dashboardUser;
}

type PermissionGateProps = {
  beAdmin?: boolean;
  permission?: string;
  allOf?: string[];
  anyOf?: string[];
  children: ReactNode;
};

export function PermissionGate({
  beAdmin,
  permission,
  allOf,
  anyOf,
  children,
}: PermissionGateProps) {
  const ctx = useContext(DashboardPermissionsContext);
  if (!ctx) {
    throw new Error(
      "PermissionGate must be used within DashboardPermissionsProvider",
    );
  }

  const { dashboardUser } = ctx;
  let hasAccess = true;

  if (beAdmin) {
    hasAccess = isAdmin(dashboardUser);
  }

  if (permission) {
    hasAccess = checkPermission(dashboardUser, permission);
  }
  if (allOf) {
    hasAccess = allOf.every((key) => checkPermission(dashboardUser, key));
  }
  if (anyOf) {
    hasAccess = anyOf.some((key) => checkPermission(dashboardUser, key));
  }

  return hasAccess ? children : null;
}
