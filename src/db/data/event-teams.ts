import { query } from ".";

export async function findByTeamId(id: string) {
  return query.eventTeams.findOne({
    where: (t, { eq }) => eq(t.id, id),
  });
}

export async function findTeamsByIds(teamIds: string[]) {
  if (!teamIds.length) return [];

  return query.eventTeams.findMany({
    where: (t, { inArray }) => inArray(t.id, teamIds),
  });
}

export async function findByIdandEvent(eventId: string, teamId: string) {
  return query.eventTeams.findOne({
    where: (t, { and, eq }) => and(eq(t.id, teamId), eq(t.eventId, eventId)),
  });
}

export async function memberCount(eventId: string, teamId: string) {
  return (
    await query.eventParticipants.findMany({
      where: (p, { and, eq }) =>
        and(eq(p.eventId, eventId), eq(p.teamId, teamId)),
    })
  ).length;
}

export async function teamCount(eventId: string) {
  return (
    await query.eventTeams.findMany({
      where: (t, { eq, and }) =>
        and(eq(t.eventId, eventId), eq(t.isComplete, true)),
    })
  ).length;
}

export async function teamCountWithPayments(eventId: string) {
  return (
    await query.eventTeams.findMany({
      where: (t, { eq, and, isNotNull }) =>
        and(eq(t.eventId, eventId), isNotNull(t.paymentId)),
    })
  ).length;
}
