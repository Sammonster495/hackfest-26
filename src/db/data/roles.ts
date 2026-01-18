import { and, eq } from "drizzle-orm";
import db from "~/db";
import { rolePermissions } from "~/db/schema";
import { parseBody } from "~/lib/validation/parse";
import {
  type CreateRoleInput,
  createRoleSchema,
  type UpdateRoleInput,
  updateRoleSchema,
} from "~/lib/validation/role";
import { query } from "./index";

export async function findById(id: string) {
  return query.roles.findOne({
    where: (r, { eq }) => eq(r.id, id),
  });
}

export async function findByName(name: string) {
  return query.roles.findOne({
    where: (r, { eq }) => eq(r.name, name),
  });
}

export async function listRoles() {
  return query.roles.findMany({});
}

export async function listActiveRoles() {
  return query.roles.findMany({
    where: (r, { eq }) => eq(r.isActive, true),
  });
}

export async function listSystemRoles() {
  return query.roles.findMany({
    where: (r, { eq }) => eq(r.isSystemRole, true),
  });
}

export async function createRole(data: CreateRoleInput) {
  const payload = parseBody(createRoleSchema, data);
  return query.roles.insert(payload);
}

export async function updateRole(id: string, data: UpdateRoleInput) {
  const payload = updateRoleSchema.parse(data);
  return query.roles.update(id, payload);
}

export async function deactivateRole(id: string) {
  return query.roles.update(id, { isActive: false });
}

export async function activateRole(id: string) {
  return query.roles.update(id, { isActive: true });
}

export async function getRolePermissions(roleId: string) {
  return db.query.rolePermissions.findMany({
    where: (rp, { eq }) => eq(rp.roleId, roleId),
    with: {
      permission: true,
    },
  });
}

export async function addPermissionToRole(
  roleId: string,
  permissionId: string,
) {
  return db
    .insert(rolePermissions)
    .values({ roleId, permissionId })
    .returning();
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string,
) {
  return db
    .delete(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId),
      ),
    )
    .returning();
}
