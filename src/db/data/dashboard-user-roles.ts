import db from "~/db";
import {
  type AssignRoleInput,
  assignRoleSchema,
} from "~/lib/validation/dashboard-user-role";
import { parseBody } from "~/lib/validation/parse";
import { query } from "./index";

export async function findById(id: string) {
  return query.dashboardUserRoles.findOne({
    where: (dur, { eq }) => eq(dur.id, id),
  });
}

export async function findByDashboardUserId(dashboardUserId: string) {
  return query.dashboardUserRoles.findMany({
    where: (dur, { eq }) => eq(dur.dashboardUserId, dashboardUserId),
    with: {
      role: {
        with: {
          permissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });
}

export async function findActiveRolesByDashboardUserId(
  dashboardUserId: string,
) {
  return query.dashboardUserRoles.findMany({
    where: (dur, { eq, and }) =>
      and(eq(dur.dashboardUserId, dashboardUserId), eq(dur.isActive, true)),
    with: {
      role: {
        with: {
          permissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });
}

export async function findByRoleId(roleId: string) {
  return query.dashboardUserRoles.findMany({
    where: (dur, { eq }) => eq(dur.roleId, roleId),
  });
}

export async function assignRole(data: AssignRoleInput) {
  const payload = parseBody(assignRoleSchema, data);
  return query.dashboardUserRoles.insert(payload);
}

export async function revokeRole(id: string) {
  return query.dashboardUserRoles.update(id, { isActive: false });
}

export async function reactivateRole(id: string) {
  return query.dashboardUserRoles.update(id, { isActive: true });
}

export async function removeRole(id: string) {
  return query.dashboardUserRoles.delete(id);
}

export async function getDashboardUserPermissions(dashboardUserId: string) {
  const userRoles = await db.query.dashboardUserRoles.findMany({
    where: (dur, { eq, and }) =>
      and(eq(dur.dashboardUserId, dashboardUserId), eq(dur.isActive, true)),
    with: {
      role: {
        with: {
          permissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissionMap = new Map();
  for (const userRole of userRoles) {
    if (userRole.role?.permissions) {
      for (const rolePermission of userRole.role.permissions) {
        if (rolePermission.permission) {
          permissionMap.set(
            rolePermission.permission.id,
            rolePermission.permission,
          );
        }
      }
    }
  }

  return Array.from(permissionMap.values());
}
