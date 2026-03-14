import { and, eq } from "drizzle-orm";
import db from "~/db";
import { ideaRounds, ideaTeamEvaluations } from "~/db/schema/evaluator";
import {
  dashboardUserRoles,
  permissions,
  rolePermissions,
  roles,
} from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import {
  ensureRoundForEvaluation,
  type SubmissionRound,
} from "./submission-services";

const EVALUATOR_ACCESS_PERMISSION_KEY = "submission:score";

//this can be removed since permissions are checked using middleware
async function hasEvaluatorAccessPermission(userId: string) {
  const [match] = await db
    .select({ permissionId: permissions.id })
    .from(dashboardUserRoles)
    .innerJoin(roles, eq(dashboardUserRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(dashboardUserRoles.dashboardUserId, userId),
        eq(dashboardUserRoles.isActive, true),
        eq(roles.isActive, true),
        eq(permissions.key, EVALUATOR_ACCESS_PERMISSION_KEY),
      ),
    )
    .limit(1);

  return Boolean(match);
}

export async function submitEvaluationScore({
  evaluatorId,
  teamId,
  score,
  round,
}: {
  evaluatorId: string;
  teamId: string;
  score: number;
  round: SubmissionRound;
}) {
  const canScore = await hasEvaluatorAccessPermission(evaluatorId);

  if (!canScore) {
    throw new AppError("You do not have evaluator access", 403, {
      title: "Access denied",
      description:
        "Your current roles do not include evaluator access for submissions.",
    });
  }

  if (!Number.isInteger(score) || score < 0 || score > 10) {
    throw new AppError("Score must be an integer between 0 and 10", 400, {
      title: "Invalid score",
      description: "Allowed score range is 0 to 10.",
    });
  }

  const submission = await db.query.ideaSubmission.findFirst({
    where: (table, { eq }) => eq(table.teamId, teamId),
    columns: { teamId: true },
  });

  if (!submission) {
    throw new AppError("Submission not found for the team", 404, {
      title: "Submission missing",
      description: "Team must have an idea submission before evaluation.",
    });
  }

  const roundRecord = await ensureRoundForEvaluation(round);

  const [existing] = await db
    .select({ id: ideaTeamEvaluations.id })
    .from(ideaTeamEvaluations)
    .where(
      and(
        eq(ideaTeamEvaluations.roundId, roundRecord.id),
        eq(ideaTeamEvaluations.teamId, teamId),
        eq(ideaTeamEvaluations.evaluatorId, evaluatorId),
      ),
    )
    .limit(1);

  let mode: "updated" | "created";

  if (existing) {
    await db
      .update(ideaTeamEvaluations)
      .set({ rawTotalScore: score })
      .where(eq(ideaTeamEvaluations.id, existing.id));
    mode = "updated";
  } else {
    await db.insert(ideaTeamEvaluations).values({
      id: crypto.randomUUID(),
      roundId: roundRecord.id,
      teamId,
      evaluatorId,
      rawTotalScore: score,
    });
    mode = "created";
  }

  //Z-score normalized scores for the entire round so rankings stay fair
  await recomputeNormalizedScores(roundRecord.id);

  return { mode };
}

export async function getEvaluatorScore({
  evaluatorId,
  teamId,
  round,
}: {
  evaluatorId: string;
  teamId: string;
  round: SubmissionRound;
}) {
  const roundName = round === "ROUND_2" ? "Round 2" : "Round 1";
  const [roundRecord] = await db
    .select({ id: ideaRounds.id })
    .from(ideaRounds)
    .where(eq(ideaRounds.name, roundName))
    .limit(1);

  if (!roundRecord) {
    return null;
  }

  const evaluation = await db
    .select({ score: ideaTeamEvaluations.rawTotalScore })
    .from(ideaTeamEvaluations)
    .where(
      and(
        eq(ideaTeamEvaluations.roundId, roundRecord.id),
        eq(ideaTeamEvaluations.teamId, teamId),
        eq(ideaTeamEvaluations.evaluatorId, evaluatorId),
      ),
    )
    .limit(1);

  return evaluation[0]?.score ?? null;
}

//z-score computation
function computeZScores(
  evaluations: { id: string; evaluatorId: string; rawTotalScore: number }[],
): { id: string; normalizedTotalScore: number }[] {
  //group raw scores by evaluator
  const byEvaluator = new Map<string, number[]>();
  for (const e of evaluations) {
    const list = byEvaluator.get(e.evaluatorId) ?? [];
    list.push(e.rawTotalScore);
    byEvaluator.set(e.evaluatorId, list);
  }

  // Compute per-evaluator mean and population standard deviation
  const evalStats = new Map<string, { mean: number; stddev: number }>();
  for (const [evaluatorId, scores] of byEvaluator) {
    const n = scores.length;
    const mean = scores.reduce((s, v) => s + v, 0) / n;
    const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    evalStats.set(evaluatorId, { mean, stddev: Math.sqrt(variance) });
  }

  return evaluations.map((e) => {
    const { mean, stddev } = evalStats.get(e.evaluatorId)!;
    // If stddev is near zero the evaluator scores everyone the same — z = 0
    const z = stddev < 1e-9 ? 0 : (e.rawTotalScore - mean) / stddev;
    return { id: e.id, normalizedTotalScore: z };
  });
}

export async function recomputeNormalizedScores(roundId: string) {
  const evaluations = await db
    .select({
      id: ideaTeamEvaluations.id,
      evaluatorId: ideaTeamEvaluations.evaluatorId,
      rawTotalScore: ideaTeamEvaluations.rawTotalScore,
    })
    .from(ideaTeamEvaluations)
    .where(eq(ideaTeamEvaluations.roundId, roundId));

  if (evaluations.length === 0) return;

  const normalized = computeZScores(evaluations);

  await Promise.all(
    normalized.map(({ id, normalizedTotalScore }) =>
      db
        .update(ideaTeamEvaluations)
        .set({ normalizedTotalScore })
        .where(eq(ideaTeamEvaluations.id, id)),
    ),
  );
}
