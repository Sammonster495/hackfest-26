import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import db from "../index";
import {
  dashboardUserRoles,
  dashboardUsers,
  ideaSubmission,
  mentorFeedback,
  mentorRoundAssignments,
  mentorRounds,
  mentors,
  roles,
  selected,
  teams,
  tracks,
  labTeams,
} from "../schema";

export async function getMentorUsers() {
  const mentorUsers = await db
    .select({
      id: dashboardUsers.id,
      name: dashboardUsers.name,
      username: dashboardUsers.username,
    })
    .from(dashboardUsers)
    .innerJoin(
      dashboardUserRoles,
      and(
        eq(dashboardUserRoles.dashboardUserId, dashboardUsers.id),
        eq(dashboardUserRoles.isActive, true),
      ),
    )
    .innerJoin(roles, eq(roles.id, dashboardUserRoles.roleId))
    .where(eq(roles.name, "MENTOR"))
    .orderBy(asc(dashboardUsers.name));

  return Array.from(
    new Map(mentorUsers.map((user) => [user.id, user])).values(),
  );
}

export async function getSelectableMentorTeams(labId: string | null = null) {
  const conditions: any[] = [eq(teams.teamStage, "SELECTED")];
  if (labId !== null) {
    conditions.push(
      inArray(
        teams.id,
        db
          .select({ teamId: labTeams.teamId })
          .from(labTeams)
          .where(eq(labTeams.labId, labId)),
      ),
    );
  }

  const data = await db.query.teams.findMany({
    columns: {
      id: true,
      name: true,
    },
    where: (team, { eq }) => and(...conditions),
    orderBy: (team, { asc }) => asc(team.name),
    with: {
      ideaSubmission: {
        columns: {
          trackId: true,
        },
      },
    },
  });

  return data.map((team) => ({
    id: team.id,
    name: team.name,
    trackId: team.ideaSubmission?.trackId || null,
  }));
}

export async function getMentorByDashboardUserId(dashboardUserId: string) {
  return db.query.mentors.findFirst({
    where: (m, { eq }) => eq(m.dashboardUserId, dashboardUserId),
  });
}

export async function getMentorRowsByDashboardUserId(dashboardUserId: string) {
  return db.query.mentors.findMany({
    where: (m, { eq }) => eq(m.dashboardUserId, dashboardUserId),
  });
}

export async function getAssignedTeamIdsForMentorRound(
  mentorRoundId: string,
  mentorId: string,
) {
  const assignments = await db
    .select({ teamId: mentorRoundAssignments.teamId })
    .from(mentorRoundAssignments)
    .where(
      and(
        eq(mentorRoundAssignments.mentorRoundId, mentorRoundId),
        eq(mentorRoundAssignments.mentorId, mentorId),
      ),
    );

  return assignments.map((assignment) => assignment.teamId);
}

export async function countSelectedTeamsByIds(teamIds: string[]) {
  if (teamIds.length === 0) return 0;

  const selectedTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(inArray(teams.id, teamIds), eq(teams.teamStage, "SELECTED")));

  return selectedTeams.length;
}

export async function getMentorRoundById(roundId: string) {
  return db.query.mentorRounds.findFirst({
    where: (round, { eq }) => eq(round.id, roundId),
  });
}

export async function getDashboardUserById(userId: string) {
  return db.query.dashboardUsers.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
}

export async function userHasMentorRole(userId: string) {
  const rows = await db
    .select({ id: roles.id })
    .from(dashboardUserRoles)
    .innerJoin(roles, eq(roles.id, dashboardUserRoles.roleId))
    .where(
      and(
        eq(dashboardUserRoles.dashboardUserId, userId),
        eq(dashboardUserRoles.isActive, true),
        eq(roles.name, "MENTOR"),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function getOrCreateMentorByDashboardUserId(
  dashboardUserId: string,
) {
  const existing = await getMentorByDashboardUserId(dashboardUserId);
  if (existing) return existing;

  const [created] = await db
    .insert(mentors)
    .values({ dashboardUserId })
    .returning();

  return created;
}

export async function getMentorAssignments(
  mentorRoundId: string,
  mentorId: string,
) {
  return db
    .select({
      id: mentorRoundAssignments.id,
      teamId: mentorRoundAssignments.teamId,
    })
    .from(mentorRoundAssignments)
    .where(
      and(
        eq(mentorRoundAssignments.mentorRoundId, mentorRoundId),
        eq(mentorRoundAssignments.mentorId, mentorId),
      ),
    );
}

export async function deleteMentorAssignmentsByIds(assignmentIds: string[]) {
  if (assignmentIds.length === 0) return;

  await db
    .delete(mentorRoundAssignments)
    .where(inArray(mentorRoundAssignments.id, assignmentIds));
}

export async function insertMentorAssignments(
  mentorRoundId: string,
  mentorId: string,
  teamIds: string[],
) {
  if (teamIds.length === 0) return;

  await db.insert(mentorRoundAssignments).values(
    teamIds.map((teamId) => ({
      mentorId,
      teamId,
      mentorRoundId,
    })),
  );
}

export async function insertMentorAssignmentPairs(
  mentorRoundId: string,
  assignments: Array<{ mentorId: string; teamId: string }>,
) {
  if (assignments.length === 0) return;

  await db.insert(mentorRoundAssignments).values(
    assignments.map((assignment) => ({
      mentorId: assignment.mentorId,
      teamId: assignment.teamId,
      mentorRoundId,
    })),
  );
}

export async function getRoundMentorAssignments(
  mentorRoundId: string,
  selectedTeamsOnly = false,
) {
  const baseQuery = db
    .select({
      mentorId: mentorRoundAssignments.mentorId,
      teamId: mentorRoundAssignments.teamId,
    })
    .from(mentorRoundAssignments);

  if (selectedTeamsOnly) {
    return baseQuery
      .innerJoin(teams, eq(teams.id, mentorRoundAssignments.teamId))
      .where(
        and(
          eq(mentorRoundAssignments.mentorRoundId, mentorRoundId),
          eq(teams.teamStage, "SELECTED"),
        ),
      );
  }

  return baseQuery.where(
    eq(mentorRoundAssignments.mentorRoundId, mentorRoundId),
  );
}

export async function deleteAssignmentsForMentorRound(mentorRoundId: string) {
  await db
    .delete(mentorRoundAssignments)
    .where(eq(mentorRoundAssignments.mentorRoundId, mentorRoundId));
}

export async function listMentorRounds() {
  return db.select().from(mentorRounds).orderBy(asc(mentorRounds.name));
}

export async function createMentorRound(name: string) {
  const [createdRound] = await db
    .insert(mentorRounds)
    .values({ name })
    .returning();

  return createdRound;
}

export async function updateMentorRound(
  roundId: string,
  updatePayload: {
    status?: "Draft" | "Active" | "Completed";
    name?: string;
  },
) {
  const [updatedRound] = await db
    .update(mentorRounds)
    .set(updatePayload)
    .where(eq(mentorRounds.id, roundId))
    .returning();

  return updatedRound;
}

export async function deleteMentorRound(roundId: string) {
  const [deletedRound] = await db
    .delete(mentorRounds)
    .where(eq(mentorRounds.id, roundId))
    .returning();

  return deletedRound;
}

export async function getAssignmentWithRoundStatus(assignmentId: string) {
  const rows = await db
    .select({
      assignmentId: mentorRoundAssignments.id,
      mentorId: mentorRoundAssignments.mentorId,
      roundStatus: mentorRounds.status,
    })
    .from(mentorRoundAssignments)
    .innerJoin(
      mentorRounds,
      eq(mentorRounds.id, mentorRoundAssignments.mentorRoundId),
    )
    .where(eq(mentorRoundAssignments.id, assignmentId))
    .limit(1);

  return rows[0];
}

export async function getFeedbackByAssignmentId(assignmentId: string) {
  return db
    .select({
      id: mentorFeedback.id,
      feedback: mentorFeedback.feedback,
    })
    .from(mentorFeedback)
    .where(eq(mentorFeedback.roundAssignmentId, assignmentId));
}

export async function isAssignmentOwnedByMentor(
  assignmentId: string,
  dashboardUserId: string,
) {
  const rows = await db
    .select({ assignmentId: mentorRoundAssignments.id })
    .from(mentorRoundAssignments)
    .innerJoin(mentors, eq(mentors.id, mentorRoundAssignments.mentorId))
    .where(
      and(
        eq(mentorRoundAssignments.id, assignmentId),
        eq(mentors.dashboardUserId, dashboardUserId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function createMentorFeedback(
  assignmentId: string,
  feedback: string,
) {
  await db.insert(mentorFeedback).values({
    roundAssignmentId: assignmentId,
    feedback,
  });
}

export async function updateMentorFeedback(
  feedbackId: string,
  feedback: string,
) {
  await db
    .update(mentorFeedback)
    .set({ feedback })
    .where(eq(mentorFeedback.id, feedbackId));
}

export async function deleteMentorFeedbackById(feedbackId: string) {
  await db.delete(mentorFeedback).where(eq(mentorFeedback.id, feedbackId));
}

export async function getMentorFeedbackHistory(params: {
  teamId?: string | null;
  mentorRoundId?: string | null;
  dashboardUserId?: string;
}) {
  const filters = [];

  if (params.dashboardUserId) {
    filters.push(eq(mentors.dashboardUserId, params.dashboardUserId));
  }

  if (params.teamId) {
    filters.push(eq(mentorRoundAssignments.teamId, params.teamId));
  }

  if (params.mentorRoundId) {
    filters.push(
      eq(mentorRoundAssignments.mentorRoundId, params.mentorRoundId),
    );
  }

  return db
    .select({
      assignmentId: mentorRoundAssignments.id,
      teamId: teams.id,
      teamName: teams.name,
      mentorRoundId: mentorRounds.id,
      mentorRoundName: mentorRounds.name,
      mentorRoundStatus: mentorRounds.status,
      mentorId: mentors.id,
      mentorUserId: dashboardUsers.id,
      mentorName: dashboardUsers.name,
      mentorUsername: dashboardUsers.username,
      feedbackId: mentorFeedback.id,
      feedback: mentorFeedback.feedback,
    })
    .from(mentorRoundAssignments)
    .innerJoin(mentors, eq(mentors.id, mentorRoundAssignments.mentorId))
    .innerJoin(dashboardUsers, eq(dashboardUsers.id, mentors.dashboardUserId))
    .innerJoin(
      mentorRounds,
      eq(mentorRounds.id, mentorRoundAssignments.mentorRoundId),
    )
    .innerJoin(teams, eq(teams.id, mentorRoundAssignments.teamId))
    .leftJoin(
      mentorFeedback,
      eq(mentorFeedback.roundAssignmentId, mentorRoundAssignments.id),
    )
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(mentorRounds.name), asc(dashboardUsers.name));
}

export async function getMentorAllocationsByMentorIds(mentorIds: string[]) {
  return db
    .select({
      teamNo: selected.teamNo,
      assignmentId: mentorRoundAssignments.id,
      teamId: teams.id,
      teamName: teams.name,
      teamStage: teams.teamStage,
      paymentStatus: teams.paymentStatus,
      roundId: mentorRounds.id,
      roundName: mentorRounds.name,
      roundStatus: mentorRounds.status,
      pptUrl: ideaSubmission.pptUrl,
      trackName: tracks.name,
    })
    .from(mentorRoundAssignments)
    .innerJoin(teams, eq(teams.id, mentorRoundAssignments.teamId))
    .innerJoin(selected, eq(selected.teamId, teams.id))
    .innerJoin(
      mentorRounds,
      eq(mentorRounds.id, mentorRoundAssignments.mentorRoundId),
    )
    .leftJoin(ideaSubmission, eq(ideaSubmission.teamId, teams.id))
    .leftJoin(tracks, eq(tracks.id, ideaSubmission.trackId))
    .where(
      and(
        inArray(mentorRoundAssignments.mentorId, mentorIds),
        eq(teams.teamStage, "SELECTED"),
      ),
    );
}

export async function getFeedbackCountsByAssignmentIds(
  assignmentIds: string[],
) {
  if (assignmentIds.length === 0) {
    return [] as Array<{ assignmentId: string; feedbackCount: number }>;
  }

  return db
    .select({
      assignmentId: mentorFeedback.roundAssignmentId,
      feedbackCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(mentorFeedback)
    .where(inArray(mentorFeedback.roundAssignmentId, assignmentIds))
    .groupBy(mentorFeedback.roundAssignmentId);
}
