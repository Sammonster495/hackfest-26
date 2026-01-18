// Write relations here
// Why relations? Gives type safety eg .with joins

import { relations } from "drizzle-orm";
import {
  colleges,
  dashboardUserRoles,
  dashboardUsers,
  participants,
  permissions,
  rolePermissions,
  roles,
  teams,
} from "./schema";

export const userRelations = relations(participants, ({ one }) => ({
  college: one(colleges, {
    fields: [participants.collegeId],
    references: [colleges.id],
  }),
  team: one(teams, {
    fields: [participants.teamId],
    references: [teams.id],
  }),
}));

export const collegeRelations = relations(colleges, ({ many }) => ({
  users: many(participants),
}));

export const teamRelations = relations(teams, ({ many }) => ({
  users: many(participants),
}));

export const dashboardUserRelations = relations(dashboardUsers, ({ many }) => ({
  roles: many(dashboardUserRoles),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  dashboardUsers: many(dashboardUserRoles),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const dashboardUserRoleRelations = relations(
  dashboardUserRoles,
  ({ one }) => ({
    dashboardUser: one(dashboardUsers, {
      fields: [dashboardUserRoles.dashboardUserId],
      references: [dashboardUsers.id],
    }),
    role: one(roles, {
      fields: [dashboardUserRoles.roleId],
      references: [roles.id],
    }),
  }),
);
