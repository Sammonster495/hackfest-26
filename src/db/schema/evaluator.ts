import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import {
  dashboardUsers,
  roles,
  roundStatus,
  teamStage,
  teams,
} from "../schema";

export const ideaRounds = pgTable("idea_rounds", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),

  roleId: text("role_id")
    .notNull()
    .references(() => roles.id),

  targetStage: teamStage("team_stage").default("NOT_SELECTED").notNull(),

  status: roundStatus("status").default("Draft").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideaRoundCriteria = pgTable("idea_round_criteria", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  roundId: text("round_id")
    .notNull()
    .references(() => ideaRounds.id, { onDelete: "cascade" }),

  name: text("name").notNull(),

  maxScore: integer("max_score").default(10).notNull(),
});

export const ideaScores = pgTable(
  "idea_scores",
  {
    id: text("id").primaryKey(),

    roundId: text("round_id")
      .notNull()
      .references(() => ideaRounds.id),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),

    evaluatorId: text("evaluator_id")
      .notNull()
      .references(() => dashboardUsers.id),

    criteriaId: text("criteria_id")
      .notNull()
      .references(() => ideaRoundCriteria.id),

    rawScore: integer("raw_score").notNull(),
  },
  (table) => [
    unique("unique_score").on(
      table.roundId,
      table.teamId,
      table.evaluatorId,
      table.criteriaId,
    ),
  ],
);

export const ideaTeamEvaluations = pgTable(
  "idea_team_evaluations",
  {
    id: text("id").primaryKey(),

    roundId: text("round_id")
      .notNull()
      .references(() => ideaRounds.id),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),

    evaluatorId: text("evaluator_id")
      .notNull()
      .references(() => dashboardUsers.id),

    rawTotalScore: integer("raw_total_score").notNull().default(0),

    normalizedTotalScore: integer("normalized_total_score")
      .notNull()
      .default(0),
  },
  (table) => [
    unique("unique_team_evaluation").on(
      table.roundId,
      table.teamId,
      table.evaluatorId,
    ),
  ],
);
