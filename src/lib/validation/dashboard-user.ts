import { z } from "zod";

export const dashboardUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  name: z.string(),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createDashboardUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  passwordHash: z.string().min(1, "Password hash is required"),
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().default(true).optional(),
});

export const updateDashboardUserSchema = dashboardUserSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    passwordHash: true,
  })
  .partial()
  .extend({
    passwordHash: z.string().min(1).optional(),
  });

export type DashboardUser = z.infer<typeof dashboardUserSchema>;
export type CreateDashboardUserInput = z.infer<
  typeof createDashboardUserSchema
>;
export type UpdateDashboardUserInput = z.infer<
  typeof updateDashboardUserSchema
>;
