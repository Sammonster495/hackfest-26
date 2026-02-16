import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const dashboardUsers = pgTable(
  "dashboard_user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    email: text("email").unique(),
    phone: text("phone").unique(),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index("dashboard_user_is_active_idx").on(table.isActive)],
);

export const roles = pgTable(
  "roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystemRole: boolean("is_system_role").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    index("role_is_active_idx").on(table.isActive),
    index("role_is_system_role_idx").on(table.isSystemRole),
  ],
);

export const permissions = pgTable("permission", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permission",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.roleId, table.permissionId],
    }),
    index("role_permission_role_id_idx").on(table.roleId),
    index("role_permission_permission_id_idx").on(table.permissionId),
  ],
);

export const dashboardUserRoles = pgTable(
  "dashboard_user_role",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    dashboardUserId: text("dashboard_user_id")
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => [
    index("dashboard_user_role_dashboard_user_id_idx").on(
      table.dashboardUserId,
    ),
    index("dashboard_user_role_role_id_idx").on(table.roleId),
    index("dashboard_user_role_dashboard_user_id_is_active_idx").on(
      table.dashboardUserId,
      table.isActive,
    ),
  ],
);
