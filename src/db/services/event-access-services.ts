import { and, eq } from "drizzle-orm";
import db from "~/db";
import {
  dashboardUsers,
  eventOrganizers,
  eventParticipants,
  eventTeams,
} from "~/db/schema";

export async function canAccessEvent(
  userId: string,
  eventId: string,
  isAdminUser: boolean,
) {
  if (isAdminUser) return true;

  const organizer = await db.query.eventOrganizers.findFirst({
    where: (organizer, { and, eq }) =>
      and(eq(organizer.organizerId, userId), eq(organizer.eventId, eventId)),
  });

  return Boolean(organizer);
}

export async function canAccessTeam(
  userId: string,
  teamId: string,
  isAdminUser: boolean,
) {
  if (isAdminUser) return true;

  const team = await db
    .select({ id: eventTeams.id })
    .from(eventTeams)
    .innerJoin(
      eventOrganizers,
      and(
        eq(eventOrganizers.eventId, eventTeams.eventId),
        eq(eventOrganizers.organizerId, userId),
      ),
    )
    .where(eq(eventTeams.id, teamId))
    .limit(1);

  return team.length > 0;
}

export async function canAccessParticipant(
  userId: string,
  participantId: string,
  isAdminUser: boolean,
) {
  if (isAdminUser) return true;

  const participant = await db
    .select({ id: eventParticipants.id })
    .from(eventParticipants)
    .innerJoin(
      eventOrganizers,
      and(
        eq(eventOrganizers.eventId, eventParticipants.eventId),
        eq(eventOrganizers.organizerId, userId),
      ),
    )
    .where(eq(eventParticipants.id, participantId))
    .limit(1);

  return participant.length > 0;
}

export async function getEventAssignableOrganizers() {
  const users = await db.query.dashboardUsers.findMany({
    where: eq(dashboardUsers.isActive, true),
    with: {
      roles: {
        where: (roleAssignment, { eq }) => eq(roleAssignment.isActive, true),
        with: {
          role: {
            with: {
              permissions: {
                with: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const assignableUsers = users
    .filter((user) => {
      return user.roles.some((assignment) =>
        assignment.role?.permissions?.some(
          (permission) => permission.permission.key === "event:organizer",
        ),
      );
    })
    .map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return assignableUsers;
}
