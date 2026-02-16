import { query } from ".";

export async function findById(id: string) {
  return query.eventUsers.findOne({
    where: (u, { eq }) => eq(u.id, id),
  });
}

export async function findByEvent(eventId: string, userId: string) {
  return query.eventParticipants.findOne({
    where: (p, { and, eq }) =>
      and(eq(p.eventId, eventId), eq(p.userId, userId)),
  });
}

export async function deleteParticipant(id: string) {
  return query.eventParticipants.delete(id);
}
