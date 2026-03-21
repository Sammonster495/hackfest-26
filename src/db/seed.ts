import "dotenv/config";
import { and, count, eq, or } from "drizzle-orm";
import { hashPassword } from "~/lib/auth/password";
import {
  eventAudienceEnum,
  eventStatusEnum,
  eventTypeEnum,
  StateEnum,
} from "./enum";
import db from "./index";
import {
  colleges,
  dashboardUserRoles,
  dashboardUsers,
  eventOrganizers,
  eventParticipants,
  events,
  eventTeams,
  participants,
  permissions,
  rolePermissions,
  roles,
} from "./schema";
import { colleges as andhraPradeshColleges } from "./seedData/AndhraPradesh";
import { colleges as goaColleges } from "./seedData/Goa";
import { colleges as karnatakaColleges } from "./seedData/Karnataka";
import { colleges as keralaColleges } from "./seedData/Kerala";
import { colleges as maharashtraColleges } from "./seedData/Maharashtra";
import { colleges as tamilNaduColleges } from "./seedData/TamilNadu";

async function seed() {
  console.log("Seeding database...");

  // Seed colleges
  console.log("Seeding colleges...");
  const existingColleges = await db.select().from(colleges).limit(1);
  if (existingColleges.length === 0) {
    const collegeData = [
      ...andhraPradeshColleges.map((name) => ({
        name,
        state: StateEnum.AndhraPradesh,
      })),
      ...goaColleges.map((name) => ({ name, state: StateEnum.Goa })),
      ...karnatakaColleges.map((name) => ({
        name,
        state: StateEnum.Karnataka,
      })),
      ...keralaColleges.map((name) => ({ name, state: StateEnum.Kerala })),
      ...maharashtraColleges.map((name) => ({
        name,
        state: StateEnum.Maharashtra,
      })),
      ...tamilNaduColleges.map((name) => ({
        name,
        state: StateEnum.TamilNadu,
      })),
    ];

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
    {
      name: "EVENT_ORGANIZER",
      description: "Organize and manage events",
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
    {
      key: "colleges:manage",
      description: "View and manage college requests",
    },
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
    // Event management
    { key: "event:manage", description: "Get access to manage events tab" },
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
    EVENT_ORGANIZER: [
      "dashboard:access",
      "event:manage",
      "event:create",
      "event:read",
      "event:update",
      "event:attendance",
      "event:delete",
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

  console.log("Seeding Dashboard Organizer");
  // Get existing organizer
  const existingOrganizer = await db
    .select()
    .from(dashboardUsers)
    .where(eq(dashboardUsers.username, "organizer"))
    .limit(1);
  let organizer: typeof dashboardUsers.$inferSelect | null = null;
  if (existingOrganizer.length > 0) {
    console.log("⚠️  Event Organizer already exists. Skipping.");
    organizer = existingOrganizer[0];
  } else {
    // Create new organizer
    const newOrganizers = await db
      .insert(dashboardUsers)
      .values({
        username: "organizer",
        passwordHash: await hashPassword("organizer"),
        name: "Event Organizer",
        isActive: true,
      })
      .returning();
    organizer = newOrganizers[0];

    // Assign EVENT_ORGANIZER role to organizer user
    const organizerRoleId = roleMap.get("EVENT_ORGANIZER");
    if (!organizerRoleId) {
      throw new Error("EVENT_ORGANIZER role not found");
    }

    await db.insert(dashboardUserRoles).values({
      dashboardUserId: organizer.id,
      roleId: organizerRoleId,
      isActive: true,
    });

    console.log("✅ Created event organizer user and assigned role");
  }

  // Seed Events
  console.log("Seeding events...");
  const existingEventsCount = await db.select({ count: count() }).from(events);
  const [adminUser] = await db
    .select()
    .from(dashboardUsers)
    .where(eq(dashboardUsers.username, "admin"))
    .limit(1);
  if (existingEventsCount.length > 0 && existingEventsCount[0].count === 0) {
    const eventLength = 20;
    const newEvents = await db
      .insert(events)
      .values(
        Array.from({ length: eventLength }, (_, i) => ({
          title: `Event ${i + 1}`,
          description: `Description for Event ${i + 1}. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Laudantium reiciendis provident quidem eligendi animi praesentium natus dolores accusantium quibusdam nulla vitae deserunt quam iusto, voluptatibus mollitia autem. Laudantium, fuga tempora?`,
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          venue: `Venue ${i + 1}`,
          image: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl_LkmRRISlkI9wz7dZCmGDHJ68mMWaW4zZg&s`,
          // teamSize: i % 3 === 0 ? 1 : 4,
          type: eventTypeEnum.enumValues[
            Math.floor(Math.random() * eventTypeEnum.enumValues.length)
          ],
          status:
            eventStatusEnum.enumValues[
              Math.floor(i % eventStatusEnum.enumValues.length)
            ],
          audience:
            eventAudienceEnum.enumValues[
              Math.floor(Math.random() * eventAudienceEnum.enumValues.length)
            ],
          category: Math.random() > 0.5 ? "Technical" : "Non-Technical",
          amount: 100 + i * 100,
          maxTeams: 10 + i,
          minTeamSize: Math.floor(Math.random() * 3) + 1,
          maxTeamSize: Math.floor(Math.random() * 3) + 2,
        })),
      )
      .returning();

    await db.insert(eventOrganizers).values(
      newEvents.map((ev) => {
        return {
          eventId: ev.id,
          organizerId:
            Math.floor(Math.random() * 2) === 0 ? organizer.id : adminUser.id,
        };
      }),
    );
    console.log("✅ Seeded events");
  } else {
    console.log("⚠️  Events already exist. Skipping.");
  }

  // seed Event Participants
  console.log("Seeding event participants...");
  const publishedEvents = await db
    .select()
    .from(events)
    .where(or(eq(events.status, "Published"), eq(events.status, "Ongoing")));
  const college = await db
    .select()
    .from(colleges)
    .limit(1)
    .then((res) => res[0]);
  let eventUsersList = await db.select().from(participants);
  if (eventUsersList.length === 0) {
    eventUsersList = await db
      .insert(participants)
      .values(
        Array.from({ length: 10 }, (_, i) => ({
          name: `Participant ${i + 1}`,
          email: `participant${i + 1}@hackfest.dev`,
          collegeId: college.id,
        })),
      )
      .returning();
  }
  for (const event of publishedEvents) {
    const existingTeams = await db
      .select()
      .from(eventTeams)
      .where(eq(eventTeams.eventId, event.id));
    if (existingTeams.length === 0) {
      const teams = await db
        .insert(eventTeams)
        .values(
          Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
            name: `Team ${i + 1} for ${event.title}`,
            eventId: event.id,
            isComplete: true,
          })),
        )
        .returning();

      const usedUserIds = new Set<string>();
      await db.insert(eventParticipants).values(
        teams.flatMap((team) => {
          const availableUsers = eventUsersList.filter(
            (user) => !usedUserIds.has(user.id),
          );
          const teamSize =
            team.id === teams[0].id ? 1 : Math.floor(Math.random() * 4) + 1;
          const selectedUsers = availableUsers
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(teamSize, availableUsers.length));

          selectedUsers.forEach((user) => {
            usedUserIds.add(user.id);
          });

          return selectedUsers.map((user, idx) => ({
            eventId: event.id,
            userId: user.id,
            teamId: team.id,
            isLeader: idx === 0,
          }));
        }),
      );
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
