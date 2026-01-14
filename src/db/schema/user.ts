import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courseEnum, genderEnum, roleEnum, stateEnum } from "../enum";
import { teams } from "./team";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  phone: text("phone"),
  state: stateEnum("state"),
  course: courseEnum("course"),
  gender: genderEnum("gender"),
  isLeader: boolean("isLeader").notNull().default(false),
  role: roleEnum("role").default("User").notNull(),
  attended: boolean("attended").notNull().default(false),
  isRegistrationComplete: boolean("is_registration_complete")
    .notNull()
    .default(false),
  idProof: text("idProof"),
  resume: text("resume"),
  github: text("github"),

  collegeId: text("college_id").references(() => colleges.id, {
    onDelete: "set null",
  }),
  teamId: text("team_id").references(() => teams.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const colleges = pgTable("college", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique(),
  state: stateEnum("state"),
});
