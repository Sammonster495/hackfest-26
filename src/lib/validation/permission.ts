import { z } from "zod";

export const permissionSchema = z.object({
  id: z.string(),
  key: z.string(),
  description: z.string().nullable(),
});

export const createPermissionSchema = z.object({
  key: z.string().min(1, "Permission key is required"),
  description: z.string().optional().nullable(),
  module: z.string().optional().nullable(),
});

export const updatePermissionSchema = permissionSchema
  .omit({
    id: true,
  })
  .partial();

export type Permission = z.infer<typeof permissionSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
