import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";
import db from "~/db";
import {
  colleges,
  ideaSubmission,
  participants,
  permissions,
  rolePermissions,
  roles,
  teams,
  tracks,
} from "~/db/schema";
import {
  ideaRoundCriteria,
  ideaRounds,
  ideaTeamEvaluations,
} from "~/db/schema/evaluator";
import { AppError } from "~/lib/errors/app-error";

export type SubmissionRound = "ROUND_1" | "ROUND_2";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const EVALUATOR_ACCESS_PERMISSION_KEY = "submission:score";

function parseOffsetCursor(cursor?: string) {
  if (!cursor) return 0;
  const parsed = Number.parseInt(cursor, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function getRoundName(round: SubmissionRound) {
  return round === "ROUND_2" ? "Round 2" : "Round 1";
}

export async function listSubmissionsForRound({
  round,
  cursor,
  limit = DEFAULT_LIMIT,
  search,
  trackId,
  evaluatorId,
  sortOrder = "desc",
}: {
  round: SubmissionRound;
  cursor?: string;
  limit?: number;
  search?: string;
  trackId?: string;
  evaluatorId?: string;
  sortOrder?: "asc" | "desc";
}) {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const offset = parseOffsetCursor(cursor);
  const conditions = [isNotNull(ideaSubmission.id)];

  if (round === "ROUND_2") {
    conditions.push(eq(teams.teamStage, "SEMI_SELECTED"));
  }

  if (search?.trim()) {
    conditions.push(ilike(teams.name, `%${search.trim()}%`));
  }

  if (trackId && trackId !== "all") {
    conditions.push(eq(ideaSubmission.trackId, trackId));
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      id: ideaSubmission.id,
      teamId: ideaSubmission.teamId,
      ideaTitle: teams.name,
      pdfUrl: ideaSubmission.pptUrl,
      createdAt: ideaSubmission.createdAt,
      teamName: teams.name,
      teamStage: teams.teamStage,
      trackId: tracks.id,
      trackName: tracks.name,
    })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .innerJoin(tracks, eq(ideaSubmission.trackId, tracks.id))
    .where(whereClause)
    .orderBy(
      sortOrder === "asc"
        ? asc(ideaSubmission.createdAt)
        : desc(ideaSubmission.createdAt),
      asc(ideaSubmission.id),
    )
    .offset(offset)
    .limit(safeLimit + 1);

  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;

  const nextCursor = hasMore ? String(offset + safeLimit) : null;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .where(whereClause);

  let evaluatorScoresByTeam = new Map<string, number>();

  if (evaluatorId && pageRows.length > 0) {
    const roundName = getRoundName(round);
    const [existingRound] = await db
      .select({ id: ideaRounds.id })
      .from(ideaRounds)
      .where(eq(ideaRounds.name, roundName))
      .limit(1);

    if (existingRound) {
      const teamIds = pageRows.map((row) => row.teamId);
      const evaluatorScores = await db
        .select({
          teamId: ideaTeamEvaluations.teamId,
          rawTotalScore: ideaTeamEvaluations.rawTotalScore,
        })
        .from(ideaTeamEvaluations)
        .where(
          and(
            eq(ideaTeamEvaluations.roundId, existingRound.id),
            eq(ideaTeamEvaluations.evaluatorId, evaluatorId),
            inArray(ideaTeamEvaluations.teamId, teamIds),
          ),
        );

      evaluatorScoresByTeam = new Map(
        evaluatorScores.map((item) => [item.teamId, item.rawTotalScore]),
      );
    }
  }

  return {
    submissions: pageRows.map((row) => ({
      ...row,
      evaluatorScore: evaluatorScoresByTeam.get(row.teamId) ?? null,
    })),
    nextCursor,
    totalCount,
  };
}

export async function listLeaderboard({
  cursor,
  limit = DEFAULT_LIMIT,
  trackId,
  search,
  round,
  scoreType = "average",
}: {
  cursor?: string;
  limit?: number;
  trackId?: string;
  search?: string;
  round?: SubmissionRound | "all";
  scoreType?: "average" | "sum" | "normalized";
}) {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const offset = parseOffsetCursor(cursor);
  const conditions = [isNotNull(ideaSubmission.id)];

  if (trackId && trackId !== "all") {
    conditions.push(eq(ideaSubmission.trackId, trackId));
  }

  if (search?.trim()) {
    conditions.push(ilike(teams.name, `%${search.trim()}%`));
  }

  if (round === "ROUND_2") {
    conditions.push(eq(teams.teamStage, "SEMI_SELECTED"));
  }

  if (round === "ROUND_1") {
    conditions.push(eq(teams.teamStage, "NOT_SELECTED"));
  }

  const whereClause = and(...conditions);

  const scoreExpression =
    scoreType === "sum"
      ? sql<number>`COALESCE(SUM(${ideaTeamEvaluations.rawTotalScore}), 0)`
      : scoreType === "normalized"
        ? sql<number>`COALESCE(AVG(${ideaTeamEvaluations.normalizedTotalScore}), 0)`
        : sql<number>`COALESCE(AVG(${ideaTeamEvaluations.rawTotalScore}), 0)`;

  const rows = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      collegeName: colleges.name,
      trackId: tracks.id,
      trackName: tracks.name,
      score: scoreExpression,
    })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .leftJoin(participants, eq(teams.leaderId, participants.id))
    .leftJoin(colleges, eq(participants.collegeId, colleges.id))
    .innerJoin(tracks, eq(ideaSubmission.trackId, tracks.id))
    .leftJoin(ideaTeamEvaluations, eq(ideaTeamEvaluations.teamId, teams.id))
    .where(whereClause)
    .groupBy(teams.id, teams.name, colleges.name, tracks.id, tracks.name)
    .orderBy(desc(scoreExpression), asc(teams.name))
    .offset(offset)
    .limit(safeLimit + 1);

  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore ? String(offset + safeLimit) : null;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(ideaSubmission)
    .innerJoin(teams, eq(ideaSubmission.teamId, teams.id))
    .where(whereClause);

  return {
    leaderboard: pageRows.map((entry, index) => ({
      rank: offset + index + 1,
      ...entry,
      score: Number(entry.score),
    })),
    nextCursor,
    totalCount,
  };
}

export async function moveLeaderboardTeamsToRound2(teamIds: string[]) {
  const uniqueTeamIds = Array.from(new Set(teamIds.filter(Boolean)));

  if (uniqueTeamIds.length === 0) {
    return { movedCount: 0 };
  }

  const eligibleRows = await db
    .select({ id: teams.id })
    .from(teams)
    .innerJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
    .where(
      and(
        inArray(teams.id, uniqueTeamIds),
        eq(teams.teamStage, "NOT_SELECTED"),
      ),
    );

  const eligibleTeamIds = eligibleRows.map((row) => row.id);

  if (eligibleTeamIds.length === 0) {
    return { movedCount: 0 };
  }

  const movedRows = await db
    .update(teams)
    .set({ teamStage: "SEMI_SELECTED" })
    .where(inArray(teams.id, eligibleTeamIds))
    .returning({ id: teams.id });

  return { movedCount: movedRows.length };
}

export async function listEvaluatorAccessRoles() {
  const evaluatorPermission = await db.query.permissions.findFirst({
    where: (table, { eq }) => eq(table.key, EVALUATOR_ACCESS_PERMISSION_KEY),
    columns: { id: true, key: true },
  });

  if (!evaluatorPermission) {
    throw new AppError("submission:score permission does not exist", 400, {
      title: "Evaluator permission missing",
      description:
        "Create the submission:score permission before configuring evaluator access.",
    });
  }

  const roleRows = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      isActive: roles.isActive,
      hasEvaluatorAccess:
        sql<boolean>`EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = ${roles.id} AND rp.permission_id = ${evaluatorPermission.id})`.mapWith(
          Boolean,
        ),
    })
    .from(roles)
    .orderBy(asc(roles.name));

  return {
    evaluatorPermissionKey: evaluatorPermission.key,
    roles: roleRows,
  };
}

export async function setRoleEvaluatorAccess({
  roleId,
  enabled,
}: {
  roleId: string;
  enabled: boolean;
}) {
  const evaluatorPermission = await db.query.permissions.findFirst({
    where: (table, { eq }) => eq(table.key, EVALUATOR_ACCESS_PERMISSION_KEY),
    columns: { id: true },
  });

  if (!evaluatorPermission) {
    throw new AppError("submission:score permission does not exist", 400, {
      title: "Evaluator permission missing",
      description:
        "Create the submission:score permission before configuring evaluator access.",
    });
  }

  const role = await db.query.roles.findFirst({
    where: (table, { eq }) => eq(table.id, roleId),
    columns: { id: true },
  });

  if (!role) {
    throw new AppError("Role not found", 404, {
      title: "Role missing",
      description: "The selected role no longer exists.",
    });
  }

  if (enabled) {
    await db
      .insert(rolePermissions)
      .values({ roleId, permissionId: evaluatorPermission.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, evaluatorPermission.id),
        ),
      );
  }

  return { roleId, enabled };
}

export async function ensureRoundForEvaluation(round: SubmissionRound) {
  const [roleWithEvaluatorAccess] = await db
    .select({ id: roles.id })
    .from(roles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(permissions.key, EVALUATOR_ACCESS_PERMISSION_KEY),
        eq(roles.isActive, true),
      ),
    )
    .orderBy(asc(roles.name))
    .limit(1);

  if (!roleWithEvaluatorAccess) {
    throw new AppError("No evaluator-enabled role configured", 400, {
      title: "Evaluator access missing",
      description:
        "Enable evaluator access for at least one role in Submissions settings.",
    });
  }

  const roundName = getRoundName(round);

  const [existingRound] = await db
    .select()
    .from(ideaRounds)
    .where(eq(ideaRounds.name, roundName))
    .limit(1);

  if (existingRound) {
    return existingRound;
  }

  const [createdRound] = await db
    .insert(ideaRounds)
    .values({
      name: roundName,
      roleId: roleWithEvaluatorAccess.id,
      targetStage: round === "ROUND_2" ? "SEMI_SELECTED" : "NOT_SELECTED",
      status: "Active",
    })
    .returning();

  await db.insert(ideaRoundCriteria).values({
    roundId: createdRound.id,
    name: "Overall",
    maxScore: 10,
  });

  return createdRound;
}
