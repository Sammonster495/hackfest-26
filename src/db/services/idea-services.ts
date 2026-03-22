import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  lt,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import type { DashboardUser } from "~/auth/routes-wrapper";
import { isAdmin } from "~/lib/auth/permissions";
import { AppError } from "~/lib/errors/app-error";
import {
  addEvaluationAggregationJob,
  addEvaluationNormalizationJob,
} from "~/lib/queue/normalization";
import {
  createRoundSchema,
  updateRoundStatusSchema,
} from "~/lib/validation/idea-submissions";
import db from "..";

type CreateRoundInput = z.infer<typeof createRoundSchema>;
type UpdateRoundStatusInput = z.infer<typeof updateRoundStatusSchema>;

import {
  colleges,
  dashboardUserRoles,
  dashboardUsers,
  ideaRoundAssignments,
  ideaRoundCriteria,
  ideaRounds,
  ideaScores,
  ideaSubmission,
  ideaTeamEvaluations,
  ideaTeamRoundScores,
  participants,
  roles,
  teams,
  tracks,
} from "../schema";

export async function submitIdea({
  teamId,
  pdfUrl,
  trackId,
  userId,
}: {
  teamId: string;
  pdfUrl: string;
  trackId: string;
  userId: string;
}) {
  try {
    const leader = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      columns: {
        leaderId: true,
      },
    });
    const regstrationData = await db.query.siteSettings.findFirst();
    if (regstrationData?.registrationsOpen === false) {
      throw new AppError("REGISTRATION_CLOSED", 403, {
        title: "Registration closed",
        description:
          "Team registrations have been closed. Please try next year.",
      });
    }
    if (!leader || !(leader.leaderId === userId)) {
      throw new AppError("You are not the leader of this team", 400);
    }
    const [submitIdea] = await db
      .insert(ideaSubmission)
      .values({
        teamId,
        pptUrl: pdfUrl,
        trackId,
      })
      .returning();
    const res = submitIdea;
    return res;
  } catch (error) {
    console.error("Error submitting idea:", error);
    throw new AppError("Failed to submit idea", 500);
  }
}

export async function getIdeaSubmission(teamId: string) {
  try {
    const ideaSubmissionData = await db.query.ideaSubmission.findFirst({
      where: (submission, { eq }) => eq(submission.teamId, teamId),
      with: {
        track: true,
      },
    });
    const submission = ideaSubmissionData
      ? {
          pdfUrl: ideaSubmissionData.pptUrl,
          trackId: ideaSubmissionData.trackId,
          trackName: ideaSubmissionData.track?.name ?? "Unknown Track",
        }
      : null;
    return submission;
  } catch (error) {
    console.error("Error fetching idea submission:", error);
    throw new AppError("Failed to fetch idea submission", 500);
  }
}

export async function fetchIdeas({
  cursor,
  limit = 50,
  search,
  trackId,
}: {
  cursor?: string;
  limit?: number;
  search?: string;
  trackId?: string;
}) {
  try {
    const conditions = [];

    if (search) {
      conditions.push(ilike(teams.name, `%${search}%`));
    }

    if (cursor) {
      conditions.push(lt(ideaSubmission.createdAt, new Date(cursor)));
    }

    if (trackId) {
      conditions.push(eq(ideaSubmission.trackId, trackId));
    }

    const ideas = await db
      .select({
        id: ideaSubmission.id,
        teamId: ideaSubmission.teamId,
        pptUrl: ideaSubmission.pptUrl,
        trackId: ideaSubmission.trackId,
        createdAt: ideaSubmission.createdAt,
        team: {
          id: teams.id,
          name: teams.name,
        },
        track: {
          id: tracks.id,
          name: tracks.name,
        },
      })
      .from(ideaSubmission)
      .leftJoin(teams, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(ideaSubmission.trackId, tracks.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ideaSubmission.createdAt))
      .limit(limit);

    let nextCursor: string | undefined;
    if (ideas.length === limit) {
      const lastIdea = ideas[ideas.length - 1];
      nextCursor = lastIdea.createdAt?.toISOString();
    }

    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(ideaSubmission)
      .leftJoin(teams, eq(ideaSubmission.teamId, teams.id))
      .where(search ? ilike(teams.name, `%${search}%`) : undefined);

    return {
      ideas,
      nextCursor,
      totalCount: count,
    };
  } catch (error) {
    console.error("Error fetching ideas:", error);
    throw new AppError("Failed to fetch ideas", 500);
  }
}

const MIN_EVALUATORS_PER_TEAM = 3;
const CHUNK_SIZE = 200;

export async function assignIdeaRound(roundId: string) {
  const round = await db.query.ideaRounds.findFirst({
    where: eq(ideaRounds.id, roundId),
  });
  if (!round) throw new Error(`Round not found: ${roundId}`);

  const evaluators = await db
    .select({ id: dashboardUserRoles.dashboardUserId })
    .from(dashboardUserRoles)
    .where(and(eq(dashboardUserRoles.roleId, round.roleId), eq(dashboardUserRoles.isActive, true)));

  if (evaluators.length === 0)
    throw new Error(`No evaluators found for role: ${round.roleId}`);

  if (evaluators.length < MIN_EVALUATORS_PER_TEAM)
    throw new Error(
      `Need at least ${MIN_EVALUATORS_PER_TEAM} evaluators, only ${evaluators.length} found`,
    );

  const eligibleTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .innerJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
    .where(
      and(
        eq(teams.teamStage, round.targetStage),
        isNotNull(ideaSubmission.pptUrl),
      ),
    );

  if (eligibleTeams.length === 0)
    throw new Error(
      `No teams with idea submissions found with stage: ${round.targetStage}`,
    );

  const eligibleTeamIds = eligibleTeams.map((t) => t.id);

  const alreadyAssignedTeams = await db
    .selectDistinct({ teamId: ideaRoundAssignments.teamId })
    .from(ideaRoundAssignments)
    .where(
      and(
        eq(ideaRoundAssignments.roundId, roundId),
        inArray(ideaRoundAssignments.teamId, eligibleTeamIds),
      ),
    );

  const alreadyAssignedTeamIds = new Set(
    alreadyAssignedTeams.map((a) => a.teamId),
  );

  const unassignedTeams = eligibleTeams.filter(
    (t) => !alreadyAssignedTeamIds.has(t.id),
  );

  if (unassignedTeams.length === 0)
    return { assigned: 0, message: "All eligible teams already assigned" };

  const newAssignments: {
    roundId: string;
    teamId: string;
    evaluatorId: string;
  }[] = [];

  let evalIdx = 0;

  for (const team of unassignedTeams) {
    let assigned = 0;
    let attempts = 0;
    const assignedEvaluatorsForTeam = new Set<string>();

    while (assigned < MIN_EVALUATORS_PER_TEAM && attempts < evaluators.length) {
      const evaluator = evaluators[evalIdx % evaluators.length];
      if (!evaluator) {
        evalIdx++;
        attempts++;
        continue;
      }
      evalIdx++;
      attempts++;

      if (assignedEvaluatorsForTeam.has(evaluator.id)) continue;

      newAssignments.push({
        roundId,
        teamId: team.id,
        evaluatorId: evaluator.id,
      });

      assignedEvaluatorsForTeam.add(evaluator.id);
      assigned++;
    }

    if (assigned < MIN_EVALUATORS_PER_TEAM) {
      console.warn(
        `Team ${team.id} only got ${assigned}/${MIN_EVALUATORS_PER_TEAM} evaluators`,
      );
    }
  }

  for (let i = 0; i < newAssignments.length; i += CHUNK_SIZE) {
    await db
      .insert(ideaRoundAssignments)
      .values(newAssignments.slice(i, i + CHUNK_SIZE))
      .onConflictDoNothing();
  }

  return {
    assigned: newAssignments.length,
    teamsProcessed: unassignedTeams.length,
    teamsSkipped: alreadyAssignedTeamIds.size,
    evaluators: evaluators.length,
    message: `Assigned ${newAssignments.length} slots across ${unassignedTeams.length} teams`,
  };
}

export async function reassignUnderScoredTeams(
  roundId: string,
  evaluatorId: string,
) {
  const round = await db.query.ideaRounds.findFirst({
    where: eq(ideaRounds.id, roundId),
  });
  if (!round) throw new Error(`Round not found: ${roundId}`);

  const evaluator = await db.query.dashboardUsers.findFirst({
    where: eq(dashboardUsers.id, evaluatorId),
    columns: { id: true, name: true },
  });
  if (!evaluator) throw new Error(`Evaluator not found: ${evaluatorId}`);

  const allAssignedTeams = await db
    .selectDistinct({ teamId: ideaRoundAssignments.teamId })
    .from(ideaRoundAssignments)
    .where(eq(ideaRoundAssignments.roundId, roundId));

  if (allAssignedTeams.length === 0) {
    return {
      assigned: 0,
      skipped: 0,
      message: "No teams assigned in this round",
    };
  }

  const allTeamIds = allAssignedTeams.map((t) => t.teamId);

  const scoredCounts = await db
    .select({
      teamId: ideaTeamEvaluations.teamId,
      scoredCount:
        sql<number>`count(DISTINCT ${ideaTeamEvaluations.evaluatorId})`.mapWith(
          Number,
        ),
    })
    .from(ideaTeamEvaluations)
    .where(
      and(
        eq(ideaTeamEvaluations.roundId, roundId),
        inArray(ideaTeamEvaluations.teamId, allTeamIds),
      ),
    )
    .groupBy(ideaTeamEvaluations.teamId);

  const scoredCountMap = new Map(
    scoredCounts.map((row) => [row.teamId, row.scoredCount]),
  );

  const underScoredTeamIds = allTeamIds.filter(
    (teamId) => (scoredCountMap.get(teamId) ?? 0) < MIN_EVALUATORS_PER_TEAM,
  );

  if (underScoredTeamIds.length === 0) {
    return {
      assigned: 0,
      skipped: 0,
      message: "All teams have enough evaluator scores",
    };
  }

  const alreadyAssigned = await db
    .selectDistinct({ teamId: ideaRoundAssignments.teamId })
    .from(ideaRoundAssignments)
    .where(
      and(
        eq(ideaRoundAssignments.roundId, roundId),
        eq(ideaRoundAssignments.evaluatorId, evaluatorId),
        inArray(ideaRoundAssignments.teamId, underScoredTeamIds),
      ),
    );

  const alreadyAssignedSet = new Set(alreadyAssigned.map((a) => a.teamId));

  const teamsToAssign = underScoredTeamIds.filter(
    (teamId) => !alreadyAssignedSet.has(teamId),
  );

  if (teamsToAssign.length === 0) {
    return {
      assigned: 0,
      skipped: underScoredTeamIds.length,
      message: `All ${underScoredTeamIds.length} under-scored teams are already assigned to this evaluator`,
    };
  }

  const newAssignments = teamsToAssign.map((teamId) => ({
    roundId,
    teamId,
    evaluatorId,
  }));

  for (let i = 0; i < newAssignments.length; i += CHUNK_SIZE) {
    await db
      .insert(ideaRoundAssignments)
      .values(newAssignments.slice(i, i + CHUNK_SIZE))
      .onConflictDoNothing();
  }

  return {
    assigned: teamsToAssign.length,
    skipped: alreadyAssignedSet.size,
    totalUnderScored: underScoredTeamIds.length,
    evaluatorName: evaluator.name,
    message: `Assigned ${teamsToAssign.length} under-scored teams to ${evaluator.name} (${alreadyAssignedSet.size} skipped, already assigned)`,
  };
}

export async function fetchIdeaRounds(user: DashboardUser) {
  try {
    const isUserAdmin = isAdmin(user);
    const userRoleIds = user.roles.map((role) => role.id);
    if (!isUserAdmin && userRoleIds.length === 0) {
      return [];
    }
    const rounds = await db
      .select({
        id: ideaRounds.id,
        name: ideaRounds.name,
        roleId: ideaRounds.roleId,
        roleName: roles.name,
        targetStage: ideaRounds.targetStage,
        status: ideaRounds.status,
        createdAt: ideaRounds.createdAt,
        criteriaCount:
          sql<number>`(SELECT count(*) FROM idea_round_criteria WHERE round_id = ${ideaRounds.id})`.mapWith(
            Number,
          ),
        assignmentCount:
          sql<number>`(SELECT count(DISTINCT team_id) FROM idea_round_assignments WHERE round_id = ${ideaRounds.id})`.mapWith(
            Number,
          ),
      })
      .from(ideaRounds)
      .innerJoin(roles, eq(roles.id, ideaRounds.roleId))
      .where(isUserAdmin ? undefined : inArray(ideaRounds.roleId, userRoleIds))
      .orderBy(asc(ideaRounds.createdAt));

    return rounds;
  } catch (error) {
    console.error("Error fetching idea rounds:", error);
    throw new AppError("Failed to fetch idea rounds", 500);
  }
}

export async function createIdeaRound(input: CreateRoundInput) {
  try {
    const res = createRoundSchema.safeParse(input);
    if (!res.success) {
      throw new AppError("Invalid input", 400);
    }
    const role = await db.query.roles.findFirst({
      where: (r, { eq }) => eq(r.id, res.data.roleId),
    });
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    const [createdRound] = await db
      .insert(ideaRounds)
      .values({
        name: res.data.name,
        roleId: res.data.roleId,
        targetStage: res.data.targetStage,
        status: "Draft",
      })
      .returning();

    return createdRound;
  } catch (error) {
    console.error("Error creating round:", error);
    throw new AppError("Failed to create round", 500);
  }
}

export async function updateIdeaRoundStatus(input: UpdateRoundStatusInput) {
  try {
    const res = updateRoundStatusSchema.safeParse(input);
    if (!res.success) {
      throw new AppError("Invalid input", 400);
    }
    const [updatedRound] = await db
      .update(ideaRounds)
      .set({ status: res.data.status })
      .where(eq(ideaRounds.id, res.data.id))
      .returning();

    if (!updatedRound) {
      throw new AppError("Idea round not found", 404);
    }
    return updatedRound;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error updating idea round status:", error);
    throw new AppError("Failed to update idea round status", 500);
  }
}

export async function listIdeaCriteria(roundId: string) {
  try {
    const criteria = await db
      .select()
      .from(ideaRoundCriteria)
      .where(eq(ideaRoundCriteria.roundId, roundId))
      .orderBy(asc(ideaRoundCriteria.name));

    return criteria;
  } catch (error) {
    console.error("Error fetching idea criteria:", error);
    throw new AppError("Failed to fetch idea criteria", 500);
  }
}

const createCriteriaSchema = z.object({
  roundId: z.string().min(1, "Round ID is required"),
  name: z.string().min(1, "Criteria name is required").max(120),
  maxScore: z.number().int().min(1).max(100),
});

type CreateCriteriaInput = z.infer<typeof createCriteriaSchema>;

export async function createIdeaCriterion(input: CreateCriteriaInput) {
  try {
    const result = createCriteriaSchema.safeParse(input);
    if (!result.success) {
      throw new AppError("Invalid input", 400);
    }

    const round = await db.query.ideaRounds.findFirst({
      where: (r, { eq }) => eq(r.id, result.data.roundId),
    });

    if (!round) {
      throw new AppError("Idea round not found", 404);
    }

    if (round.status !== "Draft") {
      throw new AppError(
        "Round is locked. Criteria can only be changed while status is Draft.",
        409,
      );
    }

    const existing = await db.query.ideaRoundCriteria.findFirst({
      where: (c, { eq, and }) =>
        and(eq(c.roundId, result.data.roundId), eq(c.name, result.data.name)),
    });

    if (existing) {
      throw new AppError("Criteria already exists for this round", 409);
    }

    const [created] = await db
      .insert(ideaRoundCriteria)
      .values({
        roundId: result.data.roundId,
        name: result.data.name,
        maxScore: result.data.maxScore,
      })
      .returning();

    return created;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error creating idea criteria:", error);
    throw new AppError("Failed to create idea criteria", 500);
  }
}

export async function deleteIdeaCriterion(criteriaId: string) {
  try {
    const criterion = await db.query.ideaRoundCriteria.findFirst({
      where: (c, { eq }) => eq(c.id, criteriaId),
    });

    if (!criterion) {
      throw new AppError("Criteria not found", 404);
    }

    const round = await db.query.ideaRounds.findFirst({
      where: (r, { eq }) => eq(r.id, criterion.roundId),
    });

    if (round && round.status !== "Draft") {
      throw new AppError(
        "Round is locked. Criteria can only be deleted while status is Draft.",
        409,
      );
    }

    const isCriteriaUsed = await db.query.ideaScores.findFirst({
      where: (a, { eq }) => eq(a.criteriaId, criteriaId),
    });

    if (isCriteriaUsed) {
      throw new AppError("Criteria is already used in an evaluation", 409);
    }

    await db
      .delete(ideaRoundCriteria)
      .where(eq(ideaRoundCriteria.id, criteriaId));

    return { message: "Criteria deleted" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error deleting idea criteria:", error);
    throw new AppError("Failed to delete idea criteria", 500);
  }
}

export async function fetchIdeaLeaderboard(roundId: string) {
  try {
    const round = await db.query.ideaRounds.findFirst({
      where: (r, { eq }) => eq(r.id, roundId),
    });

    if (!round) {
      throw new AppError("Round not found", 404);
    }

    const [criteriaTotal] = await db
      .select({
        totalMaxScore:
          sql<number>`coalesce(sum(${ideaRoundCriteria.maxScore}), 0)`.mapWith(
            Number,
          ),
      })
      .from(ideaRoundCriteria)
      .where(eq(ideaRoundCriteria.roundId, roundId));

    const maxPerEvaluator = criteriaTotal?.totalMaxScore ?? 0;

    const rows = await db
      .select({
        teamId: ideaTeamRoundScores.teamId,
        teamName: teams.name,
        collegeName: colleges.name,
        trackId: tracks.id,
        trackName: tracks.name,
        rawTotalScore: ideaTeamRoundScores.rawTotalScore,
        normalizedTotalScore: ideaTeamRoundScores.normalizedTotalScore,
        evaluatorCount: ideaTeamRoundScores.evaluatorCount,
        pptUrl: ideaSubmission.pptUrl,
      })
      .from(ideaTeamRoundScores)
      .innerJoin(teams, eq(teams.id, ideaTeamRoundScores.teamId))
      .leftJoin(participants, eq(participants.id, teams.leaderId))
      .leftJoin(colleges, eq(colleges.id, participants.collegeId))
      .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
      .where(eq(ideaTeamRoundScores.roundId, roundId))
      .orderBy(
        sql`${ideaTeamRoundScores.normalizedTotalScore} DESC NULLS LAST`,
        asc(teams.name),
      );

    const leaderboard = rows.map((row, index) => ({
      rank: index + 1,
      teamId: row.teamId,
      teamName: row.teamName,
      collegeName: row.collegeName,
      trackId: row.trackId,
      trackName: row.trackName,
      rawTotalScore: row.rawTotalScore,
      normalizedTotalScore: Number(row.normalizedTotalScore),
      evaluatorCount: row.evaluatorCount,
      pptUrl: row.pptUrl,
    }));

    return {
      round: {
        id: round.id,
        name: round.name,
        status: round.status,
      },
      maxPerEvaluator,
      rows: leaderboard,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error fetching idea leaderboard:", error);
    throw new AppError("Failed to fetch idea leaderboard", 500);
  }
}

export async function fetchMyAllocations(user: DashboardUser) {
  try {
    const userRoleIds = user.roles.map((role) => role.id);

    if (userRoleIds.length === 0) {
      return [];
    }

    const matchingRounds = await db
      .select({
        id: ideaRounds.id,
        name: ideaRounds.name,
        status: ideaRounds.status,
        roleId: ideaRounds.roleId,
      })
      .from(ideaRounds)
      .where(inArray(ideaRounds.roleId, userRoleIds));

    if (matchingRounds.length === 0) {
      return [];
    }

    const roundIds = matchingRounds.map((r) => r.id);

    const assignments = await db
      .select({
        assignmentId: ideaRoundAssignments.id,
        teamId: teams.id,
        teamName: teams.name,
        teamStage: teams.teamStage,
        roundId: ideaRoundAssignments.roundId,
        pptUrl: ideaSubmission.pptUrl,
        trackName: tracks.name,
      })
      .from(ideaRoundAssignments)
      .innerJoin(teams, eq(teams.id, ideaRoundAssignments.teamId))
      .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
      .where(
        and(
          eq(ideaRoundAssignments.evaluatorId, user.id),
          inArray(ideaRoundAssignments.roundId, roundIds),
        ),
      );

    if (assignments.length === 0) {
      return [];
    }

    const criteriaStats = await db
      .select({
        roundId: ideaRoundCriteria.roundId,
        totalCriteria: sql<number>`count(*)`.mapWith(Number),
        totalMaxScore:
          sql<number>`coalesce(sum(${ideaRoundCriteria.maxScore}), 0)`.mapWith(
            Number,
          ),
      })
      .from(ideaRoundCriteria)
      .where(inArray(ideaRoundCriteria.roundId, roundIds))
      .groupBy(ideaRoundCriteria.roundId);

    const scoreStats = await db
      .select({
        roundId: ideaScores.roundId,
        teamId: ideaScores.teamId,
        scoredCriteria: sql<number>`count(*)`.mapWith(Number),
        totalRawScore:
          sql<number>`coalesce(sum(${ideaScores.rawScore}), 0)`.mapWith(Number),
      })
      .from(ideaScores)
      .where(
        and(
          eq(ideaScores.evaluatorId, user.id),
          inArray(ideaScores.roundId, roundIds),
        ),
      )
      .groupBy(ideaScores.roundId, ideaScores.teamId);

    const criteriaMap = new Map(
      criteriaStats.map((item) => [item.roundId, item]),
    );
    const scoreMap = new Map(
      scoreStats.map((item) => [`${item.roundId}|${item.teamId}`, item]),
    );
    const roundMap = new Map(matchingRounds.map((r) => [r.id, r]));

    return assignments.map((assignment) => {
      const round = roundMap.get(assignment.roundId);
      if (!round) {
        throw new AppError("Round not found", 404);
      }
      const criteria = criteriaMap.get(assignment.roundId) ?? {
        totalCriteria: 0,
        totalMaxScore: 0,
      };
      const score = scoreMap.get(
        `${assignment.roundId}|${assignment.teamId}`,
      ) ?? {
        scoredCriteria: 0,
        totalRawScore: 0,
      };

      return {
        ...assignment,
        roundName: round.name,
        roundStatus: round.status,
        scoredCriteria: score.scoredCriteria,
        totalCriteria: criteria.totalCriteria,
        totalRawScore: score.totalRawScore,
        totalMaxScore: criteria.totalMaxScore,
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error fetching idea round allocations:", error);
    throw new AppError("Failed to fetch idea round allocations", 500);
  }
}

export async function fetchIdeaScores(
  user: DashboardUser,
  assignmentId: string,
) {
  try {
    const assignment = await db.query.ideaRoundAssignments.findFirst({
      where: (a, { and, eq }) =>
        and(eq(a.id, assignmentId), eq(a.evaluatorId, user.id)),
    });

    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }

    const round = await db.query.ideaRounds.findFirst({
      where: (r, { eq }) => eq(r.id, assignment.roundId),
    });

    const criteria = await db
      .select({
        id: ideaRoundCriteria.id,
        criteriaName: ideaRoundCriteria.name,
        maxScore: ideaRoundCriteria.maxScore,
      })
      .from(ideaRoundCriteria)
      .where(eq(ideaRoundCriteria.roundId, assignment.roundId));

    const existingScores = await db
      .select({
        criteriaId: ideaScores.criteriaId,
        rawScore: ideaScores.rawScore,
      })
      .from(ideaScores)
      .where(
        and(
          eq(ideaScores.roundId, assignment.roundId),
          eq(ideaScores.teamId, assignment.teamId),
          eq(ideaScores.evaluatorId, user.id),
        ),
      );

    const scoreMap = new Map(
      existingScores.map((score) => [score.criteriaId, score.rawScore]),
    );

    return {
      assignmentId: assignment.id,
      roundStatus: round?.status ?? "Draft",
      criteria: criteria.map((item) => ({
        ...item,
        rawScore: scoreMap.get(item.id) ?? 0,
      })),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error fetching idea scores:", error);
    throw new AppError("Failed to fetch idea scores", 500);
  }
}

const saveScoresSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  scores: z.array(
    z.object({
      criteriaId: z.string().min(1, "Criteria ID is required"),
      rawScore: z.number().int().min(0),
    }),
  ),
});

type SaveIdeaScoresInput = z.infer<typeof saveScoresSchema>;

export async function saveIdeaScores(
  user: DashboardUser,
  input: SaveIdeaScoresInput,
) {
  try {
    const parsed = saveScoresSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Invalid input", 400);
    }

    const { assignmentId, scores } = parsed.data;

    const assignment = await db.query.ideaRoundAssignments.findFirst({
      where: (a, { and, eq }) =>
        and(eq(a.id, assignmentId), eq(a.evaluatorId, user.id)),
    });

    if (!assignment) {
      throw new AppError("Assignment not found", 404);
    }

    const round = await db.query.ideaRounds.findFirst({
      where: (r, { eq }) => eq(r.id, assignment.roundId),
    });

    if (round?.status === "Completed") {
      throw new AppError("Round is completed. Scoring is locked.", 409);
    }

    const criteriaIds = scores.map((s) => s.criteriaId);
    const criteriaRows =
      criteriaIds.length === 0
        ? []
        : await db
            .select({
              id: ideaRoundCriteria.id,
              maxScore: ideaRoundCriteria.maxScore,
            })
            .from(ideaRoundCriteria)
            .where(
              and(
                eq(ideaRoundCriteria.roundId, assignment.roundId),
                inArray(ideaRoundCriteria.id, criteriaIds),
              ),
            );

    const criteriaMap = new Map(
      criteriaRows.map((row) => [row.id, row.maxScore]),
    );

    for (const score of scores) {
      const maxScore = criteriaMap.get(score.criteriaId);
      if (maxScore === undefined) {
        throw new AppError("Invalid criteria for this round", 400);
      }
      if (score.rawScore > maxScore) {
        throw new AppError(
          `Score for criteria exceeds max score (${maxScore})`,
          400,
        );
      }
    }

    for (const score of scores) {
      await db
        .insert(ideaScores)
        .values({
          id: crypto.randomUUID(),
          roundId: assignment.roundId,
          teamId: assignment.teamId,
          evaluatorId: user.id,
          criteriaId: score.criteriaId,
          rawScore: score.rawScore,
        })
        .onConflictDoUpdate({
          target: [
            ideaScores.roundId,
            ideaScores.teamId,
            ideaScores.evaluatorId,
            ideaScores.criteriaId,
          ],
          set: { rawScore: score.rawScore },
        });
    }

    const allScores = await db
      .select({ rawScore: ideaScores.rawScore })
      .from(ideaScores)
      .where(
        and(
          eq(ideaScores.roundId, assignment.roundId),
          eq(ideaScores.teamId, assignment.teamId),
          eq(ideaScores.evaluatorId, user.id),
        ),
      );

    const totalRawScore = allScores.reduce(
      (sum, item) => sum + item.rawScore,
      0,
    );

    await db
      .insert(ideaTeamEvaluations)
      .values({
        id: crypto.randomUUID(),
        roundId: assignment.roundId,
        teamId: assignment.teamId,
        evaluatorId: user.id,
        rawTotalScore: totalRawScore,
      })
      .onConflictDoUpdate({
        target: [
          ideaTeamEvaluations.roundId,
          ideaTeamEvaluations.teamId,
          ideaTeamEvaluations.evaluatorId,
        ],
        set: { rawTotalScore: totalRawScore },
      });

    await addEvaluationNormalizationJob(user.id, assignment.roundId);
    await addEvaluationAggregationJob(assignment.roundId);

    return { message: "Scores saved successfully", totalRawScore };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error saving idea scores:", error);
    throw new AppError("Failed to save idea scores", 500);
  }
}

export async function fetchAllAllocations(roundId: string) {
  try {
    const round = await db.query.ideaRounds.findFirst({
      where: (r, { eq }) => eq(r.id, roundId),
    });

    if (!round) {
      throw new AppError("Round not found", 404);
    }

    // Get criteria for this round
    const criteriaRows = await db
      .select({
        id: ideaRoundCriteria.id,
        name: ideaRoundCriteria.name,
        maxScore: ideaRoundCriteria.maxScore,
      })
      .from(ideaRoundCriteria)
      .where(eq(ideaRoundCriteria.roundId, roundId))
      .orderBy(asc(ideaRoundCriteria.name));

    // Get all assignments with evaluator + team + track info
    const assignments = await db
      .select({
        assignmentId: ideaRoundAssignments.id,
        evaluatorId: ideaRoundAssignments.evaluatorId,
        evaluatorName: dashboardUsers.name,
        teamId: teams.id,
        teamName: teams.name,
        trackName: tracks.name,
      })
      .from(ideaRoundAssignments)
      .innerJoin(
        dashboardUsers,
        eq(dashboardUsers.id, ideaRoundAssignments.evaluatorId),
      )
      .innerJoin(teams, eq(teams.id, ideaRoundAssignments.teamId))
      .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
      .where(eq(ideaRoundAssignments.roundId, roundId))
      .orderBy(asc(dashboardUsers.name), asc(teams.name));

    if (assignments.length === 0) {
      return { criteria: criteriaRows, allocations: [] };
    }

    // Get all scores in one query
    const allScores = await db
      .select({
        evaluatorId: ideaScores.evaluatorId,
        teamId: ideaScores.teamId,
        criteriaId: ideaScores.criteriaId,
        rawScore: ideaScores.rawScore,
      })
      .from(ideaScores)
      .where(eq(ideaScores.roundId, roundId));

    // Build lookup: "evaluatorId|teamId|criteriaId" -> rawScore
    const scoreMap = new Map<string, number>();
    for (const s of allScores) {
      scoreMap.set(`${s.evaluatorId}|${s.teamId}|${s.criteriaId}`, s.rawScore);
    }

    const allocations = assignments.map((a) => {
      const scores = criteriaRows.map((c) => ({
        criteriaId: c.id,
        criteriaName: c.name,
        maxScore: c.maxScore,
        rawScore: scoreMap.get(`${a.evaluatorId}|${a.teamId}|${c.id}`) ?? null,
      }));

      const totalRawScore = scores.reduce(
        (sum, s) => sum + (s.rawScore ?? 0),
        0,
      );
      const totalMaxScore = criteriaRows.reduce(
        (sum, c) => sum + c.maxScore,
        0,
      );

      return {
        assignmentId: a.assignmentId,
        evaluatorId: a.evaluatorId,
        evaluatorName: a.evaluatorName,
        teamId: a.teamId,
        teamName: a.teamName,
        trackName: a.trackName,
        scores,
        totalRawScore,
        totalMaxScore,
      };
    });

    return { criteria: criteriaRows, allocations };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error fetching all allocations:", error);
    throw new AppError("Failed to fetch allocations", 500);
  }
}

export async function fetchEvaluatorAllocations(
  roundId: string,
  evaluatorId: string,
) {
  try {
    const round = await db.query.ideaRounds.findFirst({
      where: eq(ideaRounds.id, roundId),
    });

    if (!round) {
      throw new AppError("Round not found", 404);
    }

    const eligibleTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        trackName: tracks.name,
      })
      .from(teams)
      .innerJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
      .where(
        and(
          eq(teams.teamStage, round.targetStage),
          isNotNull(ideaSubmission.pptUrl),
        ),
      )
      .orderBy(asc(teams.name));

    if (eligibleTeams.length === 0) {
      return [];
    }

    const teamIds = eligibleTeams.map((t) => t.id);

    const assignments = await db
      .select({
        teamId: ideaRoundAssignments.teamId,
        evaluatorId: ideaRoundAssignments.evaluatorId,
      })
      .from(ideaRoundAssignments)
      .where(
        and(
          eq(ideaRoundAssignments.roundId, roundId),
          inArray(ideaRoundAssignments.teamId, teamIds),
        ),
      );

    const evaluations = await db
      .select({
        teamId: ideaTeamEvaluations.teamId,
        evaluatorId: ideaTeamEvaluations.evaluatorId,
        rawTotalScore: ideaTeamEvaluations.rawTotalScore,
        normalizedTotalScore: ideaTeamEvaluations.normalizedTotalScore,
      })
      .from(ideaTeamEvaluations)
      .where(
        and(
          eq(ideaTeamEvaluations.roundId, roundId),
          inArray(ideaTeamEvaluations.teamId, teamIds),
        ),
      );

    const assignmentCounts = new Map<string, number>();
    const isAssigned = new Set<string>();

    for (const a of assignments) {
      assignmentCounts.set(a.teamId, (assignmentCounts.get(a.teamId) || 0) + 1);
      if (a.evaluatorId === evaluatorId) {
        isAssigned.add(a.teamId);
      }
    }

    const evaluationMap = new Map<
      string,
      { raw: number; normalized: number }
    >();
    for (const e of evaluations) {
      if (e.evaluatorId === evaluatorId) {
        evaluationMap.set(e.teamId, {
          raw: e.rawTotalScore,
          normalized: e.normalizedTotalScore,
        });
      }
    }

    return eligibleTeams.map((team) => {
      const evaluation = evaluationMap.get(team.id);
      return {
        teamId: team.id,
        teamName: team.name,
        trackName: team.trackName,
        isAssigned: isAssigned.has(team.id),
        hasScored: !!evaluation,
        rawTotalScore: evaluation ? evaluation.raw : null,
        normalizedTotalScore: evaluation ? evaluation.normalized : null,
        assignedEvaluatorCount: assignmentCounts.get(team.id) || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching evaluator allocations:", error);
    throw new AppError("Failed to fetch evaluator allocations", 500);
  }
}

export async function manageEvaluatorAllocation(
  roundId: string,
  evaluatorId: string,
  teamId: string,
  action: "assign" | "deallocate",
) {
  try {
    const round = await db.query.ideaRounds.findFirst({
      where: eq(ideaRounds.id, roundId),
    });

    if (!round) {
      throw new AppError("Round not found", 404);
    }

    if (round.status === "Completed") {
      throw new AppError("Round is completed. Assignments are locked.", 409);
    }

    if (action === "assign") {
      const existingAssignment = await db.query.ideaRoundAssignments.findFirst({
        where: and(
          eq(ideaRoundAssignments.roundId, roundId),
          eq(ideaRoundAssignments.evaluatorId, evaluatorId),
          eq(ideaRoundAssignments.teamId, teamId),
        ),
      });

      if (existingAssignment) {
        throw new AppError("Evaluator is already assigned to this team", 409);
      }

      await db
        .insert(ideaRoundAssignments)
        .values({
          roundId,
          evaluatorId,
          teamId,
        })
        .onConflictDoNothing();

      return { message: "Team assigned successfully" };
    }

    if (action === "deallocate") {
      const existingScore = await db.query.ideaTeamEvaluations.findFirst({
        where: and(
          eq(ideaTeamEvaluations.roundId, roundId),
          eq(ideaTeamEvaluations.evaluatorId, evaluatorId),
          eq(ideaTeamEvaluations.teamId, teamId),
        ),
      });

      if (existingScore) {
        throw new AppError(
          "Cannot deallocate team that has already been scored",
          409,
        );
      }

      await db
        .delete(ideaRoundAssignments)
        .where(
          and(
            eq(ideaRoundAssignments.roundId, roundId),
            eq(ideaRoundAssignments.evaluatorId, evaluatorId),
            eq(ideaRoundAssignments.teamId, teamId),
          ),
        );

      return { message: "Team deallocated successfully" };
    }

    throw new AppError("Invalid action", 400);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error managing evaluator allocation:", error);
    throw new AppError("Failed to manage evaluator allocation", 500);
  }
}

export async function fetchLeaderboardTeamDetails(
  roundId: string,
  teamId: string,
) {
  try {
    const round = await db.query.ideaRounds.findFirst({
      where: eq(ideaRounds.id, roundId),
    });

    if (!round) {
      throw new AppError("Round not found", 404);
    }

    // 1. Get all criteria for this round
    const criteria = await db
      .select({
        id: ideaRoundCriteria.id,
        name: ideaRoundCriteria.name,
        maxScore: ideaRoundCriteria.maxScore,
      })
      .from(ideaRoundCriteria)
      .where(eq(ideaRoundCriteria.roundId, roundId));

    const criteriaMap = new Map(criteria.map((c) => [c.id, c]));

    // 2. Get all evaluations for this team in this round
    const evaluations = await db
      .select({
        evaluatorId: ideaTeamEvaluations.evaluatorId,
        evaluatorName: dashboardUsers.name,
        rawTotalScore: ideaTeamEvaluations.rawTotalScore,
        normalizedTotalScore: ideaTeamEvaluations.normalizedTotalScore,
      })
      .from(ideaTeamEvaluations)
      .innerJoin(
        dashboardUsers,
        eq(ideaTeamEvaluations.evaluatorId, dashboardUsers.id),
      )
      .where(
        and(
          eq(ideaTeamEvaluations.roundId, roundId),
          eq(ideaTeamEvaluations.teamId, teamId),
        ),
      );

    if (evaluations.length === 0) {
      return { evaluations: [] };
    }

    // 3. Get individual criteria scores
    const individualScores = await db
      .select({
        evaluatorId: ideaScores.evaluatorId,
        criteriaId: ideaScores.criteriaId,
        rawScore: ideaScores.rawScore,
      })
      .from(ideaScores)
      .where(
        and(eq(ideaScores.roundId, roundId), eq(ideaScores.teamId, teamId)),
      );

    // Filter out scores that don't match our criteria (just in case)
    const validScores = individualScores.filter((s) =>
      criteriaMap.has(s.criteriaId),
    );

    // Group scores by evaluator
    const scoresByEvaluator = new Map<string, typeof validScores>();
    for (const score of validScores) {
      const list = scoresByEvaluator.get(score.evaluatorId) || [];
      list.push(score);
      scoresByEvaluator.set(score.evaluatorId, list);
    }

    // Combine everything
    const result = evaluations.map((ev) => {
      const evalScores = scoresByEvaluator.get(ev.evaluatorId) || [];

      const criteriaScores = criteria.map((c) => {
        const scoreEntry = evalScores.find((s) => s.criteriaId === c.id);
        return {
          criteriaId: c.id,
          criteriaName: c.name,
          maxScore: c.maxScore,
          rawScore: scoreEntry ? scoreEntry.rawScore : null,
        };
      });

      return {
        evaluatorId: ev.evaluatorId,
        evaluatorName: ev.evaluatorName,
        rawTotalScore: ev.rawTotalScore,
        normalizedTotalScore: ev.normalizedTotalScore,
        criteriaScores,
      };
    });

    return { evaluations: result };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error fetching leaderboard team details:", error);
    throw new AppError("Failed to fetch leaderboard team details", 500);
  }
}
