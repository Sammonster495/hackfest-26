import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "~/lib/auth/password";
import db from "./index";
import {
  colleges,
  dashboardUserRoles,
  dashboardUsers,
  permissions,
  rolePermissions,
  roles,
} from "./schema";

async function seed() {
  console.log("Seeding database...");

  // Seed colleges
  console.log("Seeding colleges...");
  const existingColleges = await db.select().from(colleges).limit(1);
  if (existingColleges.length === 0) {
    const collegeData = Array.from({ length: 20 }, (_, i) => ({
      name: `College ${i + 1}`,
      state: null,
    }));

    try {
      await db.insert(colleges).values(collegeData);
      console.log(`✅ Seeded ${collegeData.length} colleges`);
    } catch (error) {
      console.error("Error seeding colleges:", error);
      throw error;
    }
  } else {
    console.log("⚠️  Colleges already exist. Skipping.");
  }

  // Seed system roles
  console.log("Seeding system roles...");
  const systemRoles = [
    {
      name: "ADMIN",
      description: "Full control of the system",
      isSystemRole: true,
    },
    {
      name: "EVALUATOR",
      description: "Pre-hackathon idea scoring",
      isSystemRole: true,
    },
    {
      name: "SELECTOR",
      description: "Shortlisting / Top 60 / Top 10 selection",
      isSystemRole: true,
    },
    {
      name: "JUDGE",
      description: "Live judging during hackathon",
      isSystemRole: true,
    },
    {
      name: "FINAL_JUDGE",
      description: "Final scoring after hackathon",
      isSystemRole: true,
    },
    {
      name: "MENTOR",
      description: "Remarks only, no scoring",
      isSystemRole: true,
    },
  ];

  const roleMap = new Map<string, string>(); // name -> id

  for (const roleData of systemRoles) {
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleData.name))
      .limit(1);

    if (existing.length === 0) {
      const [newRole] = await db
        .insert(roles)
        .values({
          ...roleData,
          isActive: true,
        })
        .returning();
      roleMap.set(roleData.name, newRole.id);
      console.log(`✅ Created ${roleData.name} role`);
    } else {
      const existingRole = existing[0];
      if (existingRole) {
        roleMap.set(roleData.name, existingRole.id);
        console.log(`⚠️  ${roleData.name} role already exists.`);
      }
    }
  }

  // Seed permissions
  console.log("Seeding permissions...");
  const permissionList = [
    // Global / Meta
    { key: "dashboard:access", description: "Access to dashboard" },
    { key: "settings:manage", description: "Manage system settings" },
    { key: "roles:manage", description: "Manage roles" },
    { key: "users:manage_staff", description: "Manage staff users" },
    // Participant / Team Visibility
    { key: "team:view_all", description: "View all teams" },
    { key: "team:view_top60", description: "View top 60 teams" },
    {
      key: "participant:view_profile",
      description: "View participant profiles",
    },
    { key: "team:view_team_details", description: "View team details" },
    { key: "team:mark_attendance", description: "Mark Team attendance" },
    // Submissions
    { key: "submission:view", description: "View submissions" },
    { key: "submission:score", description: "Score submissions" },
    { key: "submission:remark", description: "Add remarks to submissions" },
    { key: "submission:download_ppt", description: "Download submission PPTs" },
    // Selection
    { key: "selection:promote", description: "Promote teams in selection" },
    { key: "selection:demote", description: "Demote teams in selection" },
    { key: "selection:view", description: "View selection status" },
    // Results
    { key: "results:view", description: "View results" },
    { key: "results:publish", description: "Publish results" },
    // Logistics - Attendance
    { key: "attendance:view", description: "View attendance" },
    { key: "attendance:mark", description: "Mark attendance" },
    // Logistics - Meals
    { key: "meal:view", description: "View meal records" },
    { key: "meal:mark", description: "Mark meals" },
    // Logistics - Dorms & Arenas
    { key: "dorm:view", description: "View dorm assignments" },
    { key: "dorm:assign", description: "Assign dorms" },
    { key: "arena:view", description: "View arena assignments" },
    { key: "arena:assign", description: "Assign arenas" },
    // Slot / Number Allocation
    { key: "slot:view", description: "View slot allocations" },
    { key: "slot:assign", description: "Assign slots" },
    { key: "slot:regenerate", description: "Regenerate slot allocations" },
  ];

  const permissionMap = new Map<string, string>(); // key -> id

  for (const permData of permissionList) {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.key, permData.key))
      .limit(1);

    if (existing.length === 0) {
      const [newPerm] = await db
        .insert(permissions)
        .values(permData)
        .returning();
      permissionMap.set(permData.key, newPerm.id);
      console.log(`✅ Created permission ${permData.key}`);
    } else {
      const existingPermission = existing[0];
      if (existingPermission) {
        permissionMap.set(permData.key, existingPermission.id);
        console.log(`⚠️  Permission ${permData.key} already exists.`);
      }
    }
  }

  // Map roles to permissions
  console.log("Mapping roles to permissions...");
  const rolePermissionMapping: Record<string, string[]> = {
    ADMIN: Object.keys(permissionMap), // All permissions
    EVALUATOR: [
      "dashboard:access",
      "team:view_all",
      "team:view_team_details",
      "submission:view",
      "submission:score",
      "submission:remark",
      "submission:download_ppt",
    ],
    SELECTOR: [
      "dashboard:access",
      "team:view_all",
      "team:view_team_details",
      "submission:view",
      "submission:download_ppt",
      "selection:view",
      "selection:promote",
      "selection:demote",
    ],
    JUDGE: [
      "dashboard:access",
      "team:view_top60",
      "team:view_team_details",
      "submission:view",
      "submission:score",
      "submission:remark",
    ],
    FINAL_JUDGE: [
      "dashboard:access",
      "team:view_top60",
      "team:view_team_details",
      "submission:view",
      "submission:score",
      "submission:remark",
      "results:view",
    ],
    MENTOR: [
      "dashboard:access",
      "team:view_top60",
      "team:view_team_details",
      "submission:view",
      "submission:remark",
    ],
  };

  for (const [roleName, permissionKeys] of Object.entries(
    rolePermissionMapping,
  )) {
    const roleId = roleMap.get(roleName);
    if (!roleId) {
      console.log(
        `⚠️  Role ${roleName} not found, skipping permission mapping.`,
      );
      continue;
    }

    for (const permKey of permissionKeys) {
      const permId = permissionMap.get(permKey);
      if (!permId) {
        console.log(`⚠️  Permission ${permKey} not found, skipping.`);
        continue;
      }

      // Check if mapping already exists
      const existing = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permId),
          ),
        );

      if (existing.length === 0) {
        await db.insert(rolePermissions).values({
          roleId,
          permissionId: permId,
        });
      }
    }
    console.log(`✅ Mapped permissions to ${roleName}`);
  }

  // Seed admin user
  console.log("Seeding admin user...");
  const existingAdmin = await db
    .select()
    .from(dashboardUsers)
    .where(eq(dashboardUsers.username, "admin"))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log("⚠️  Admin user already exists. Skipping.");
  } else {
    try {
      const adminRoleId = roleMap.get("ADMIN");
      if (!adminRoleId) {
        throw new Error("ADMIN role not found");
      }

      // Hash password
      const passwordHash = await hashPassword("admin");

      // Create admin user
      const [adminUser] = await db
        .insert(dashboardUsers)
        .values({
          username: "admin",
          passwordHash,
          name: "Administrator",
          isActive: true,
        })
        .returning();

      console.log("✅ Created admin user");

      // Assign ADMIN role to admin user
      await db.insert(dashboardUserRoles).values({
        dashboardUserId: adminUser.id,
        roleId: adminRoleId,
        isActive: true,
      });

      console.log("✅ Assigned ADMIN role to admin user");
    } catch (error) {
      console.error("Error seeding admin user:", error);
      throw error;
    }
  }
}

// Run seed
seed()
  .then(() => {
    console.log("Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
