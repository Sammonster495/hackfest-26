import { eq, inArray } from "drizzle-orm";
import type { EventMember, EventTeam } from "~/components/events/layout";
import {
  type UpdateEventUserInput,
  updateEventUserSchema,
} from "~/lib/validation/event";
import db from "..";
import { eventParticipants, participants } from "../schema";
import { query } from ".";

export type UserParticipation = {
  userId: string;
  eventId: string;
  collegeId: string;
  teamId: string | null;
  isLeader: boolean;
  team: EventTeam;
  teamMembers: EventMember[];
};

export async function findById(id: string) {
  return query.participants.findOne({
    where: (u, { eq }) => eq(u.id, id),
  });
}

export async function updateById(id: string, data: UpdateEventUserInput) {
  const payload = updateEventUserSchema.parse(data);
  return query.participants.update(id, payload);
}

export async function findByEvent(eventId: string, userId: string) {
  return query.eventParticipants.findOne({
    where: (p, { and, eq }) =>
      and(eq(p.eventId, eventId), eq(p.userId, userId)),
  });
}

export async function findLeaderByTeam(teamId: string) {
  return query.eventParticipants.findOne({
    where: (p, { and, eq }) => and(eq(p.teamId, teamId), eq(p.isLeader, true)),
  });
}

export async function findMembersByTeam(teamId: string) {
  return query.eventParticipants.findMany({
    where: (p, { eq }) => eq(p.teamId, teamId),
  });
}

export async function findParticipantsByTeam(eventId: string, teamId: string) {
  return query.eventParticipants.findMany({
    where: (p, { and, eq }) =>
      and(eq(p.eventId, eventId), eq(p.teamId, teamId)),
  });
}

export async function findUserParticipations(userId: string) {
  console.log("deqsx");
  try {
    const participations = await db.query.eventParticipants.findMany({
      where: (p, { eq }) => eq(p.userId, userId),
      with: {
        user: true,
        team: {
          with: {
            payment: true,
            members: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });
    const participationMap: Record<string, UserParticipation> = {};

    for (const participation of participations) {
      const eventId = participation.eventId;
      if (!participationMap[eventId]) {
        participationMap[eventId] = {
          userId: participation.userId,
          eventId: participation.eventId,
          teamId: participation.teamId,
          isLeader: participation.isLeader,
          collegeId: participation.user?.collegeId ?? "",
          team: {
            id: participation.team?.id ?? "",
            name: participation.team?.name ?? "",
            eventId: participation.team?.eventId ?? "",
            isComplete: participation.team?.isComplete ?? false,
            payment: participation.team?.payment ?? null,
          },
          teamMembers:
            participation.team?.members.map((member) => ({
              id: member.id,
              name: member.user.name ?? "",
              email: member.user.email ?? "",
              isLeader: member.isLeader,
            })) ?? [],
        };
      }
    }

    return participationMap;
  } catch (e) {
    console.log(e);
    return {};
  }
}

export async function findParticipantsByTeamIds(teamIds: string[]) {
  if (!teamIds.length) return [];

  return db
    .select({
      participant: eventParticipants,
      user: participants,
    })
    .from(eventParticipants)
    .leftJoin(participants, eq(eventParticipants.userId, participants.id))
    .where(inArray(eventParticipants.teamId, teamIds));
}
