import { z } from "zod";

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystemRole: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional().nullable(),
  isSystemRole: z.boolean().default(false).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateRoleSchema = roleSchema
  .omit({
    id: true,
  })
  .partial();

export type Role = z.infer<typeof roleSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const SYSTEM_ROLES = {
  ADMIN: "ADMIN",
  EVALUATOR: "EVALUATOR",
  SELECTOR: "SELECTOR",
  MENTOR: "MENTOR",
  JUDGE: "JUDGE",
  FINAL_JUDGE: "FINAL_JUDGE",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
