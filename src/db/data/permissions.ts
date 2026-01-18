import { parseBody } from "~/lib/validation/parse";
import {
  type CreatePermissionInput,
  createPermissionSchema,
  type UpdatePermissionInput,
  updatePermissionSchema,
} from "~/lib/validation/permission";
import { query } from "./index";

export async function findById(id: string) {
  return query.permissions.findOne({
    where: (p, { eq }) => eq(p.id, id),
  });
}

export async function findByKey(key: string) {
  return query.permissions.findOne({
    where: (p, { eq }) => eq(p.key, key),
  });
}

export async function listPermissions() {
  return query.permissions.findMany({});
}

export async function createPermission(data: CreatePermissionInput) {
  const payload = parseBody(createPermissionSchema, data);
  return query.permissions.insert(payload);
}

export async function updatePermission(
  id: string,
  data: UpdatePermissionInput,
) {
  const payload = updatePermissionSchema.parse(data);
  return query.permissions.update(id, payload);
}

export async function deletePermission(id: string) {
  return query.permissions.delete(id);
}
