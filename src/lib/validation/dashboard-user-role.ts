import { z } from "zod";

export const dashboardUserRoleSchema = z.object({
  id: z.string(),
  dashboardUserId: z.string(),
  roleId: z.string(),
  isActive: z.boolean().default(true),
  assignedAt: z.date(),
});

export const assignRoleSchema = z.object({
  dashboardUserId: z.string().min(1, "Dashboard user ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
  isActive: z.boolean().default(true).optional(),
});

export const revokeRoleSchema = z.object({
  id: z.string().min(1, "Dashboard user role ID is required"),
});

export type DashboardUserRole = z.infer<typeof dashboardUserRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RevokeRoleInput = z.infer<typeof revokeRoleSchema>;
