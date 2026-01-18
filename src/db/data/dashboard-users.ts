import { eq } from "drizzle-orm";
import db from "~/db";
import { dashboardUsers } from "~/db/schema";
import {
  type CreateDashboardUserInput,
  createDashboardUserSchema,
  type UpdateDashboardUserInput,
  updateDashboardUserSchema,
} from "~/lib/validation/dashboard-user";
import { parseBody } from "~/lib/validation/parse";
import { query } from "./index";

export async function findById(id: string) {
  return query.dashboardUsers.findOne({
    where: (u, { eq }) => eq(u.id, id),
  });
}

export async function findByUsername(username: string) {
  return query.dashboardUsers.findOne({
    where: (u, { eq }) => eq(u.username, username),
  });
}

export async function listDashboardUsers() {
  return query.dashboardUsers.findMany({});
}

export async function createDashboardUser(data: CreateDashboardUserInput) {
  const payload = parseBody(createDashboardUserSchema, data);
  return query.dashboardUsers.insert(payload);
}

export async function updateDashboardUser(
  id: string,
  data: UpdateDashboardUserInput,
) {
  const payload = updateDashboardUserSchema.parse(data);
  return query.dashboardUsers.update(id, payload);
}

export async function updateLastLogin(id: string) {
  return db
    .update(dashboardUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(dashboardUsers.id, id))
    .returning();
}

export async function deactivateDashboardUser(id: string) {
  return query.dashboardUsers.update(id, { isActive: false });
}

export async function activateDashboardUser(id: string) {
  return query.dashboardUsers.update(id, { isActive: true });
}
