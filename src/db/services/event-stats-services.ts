import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import db from "..";
import {
  eventOrganizers,
  eventParticipants,
  events,
  eventTeams,
  participants,
} from "../schema";

async function assertAccessibleTeam(
  userId: string,
  eventId: string,
  teamId: string,
  isAdminUser = false,
) {
  const organizerEvent = await assertAccessibleEvent(
    userId,
    eventId,
    isAdminUser,
  );
  if (!organizerEvent) {
    return null;
  }

  const team = await db.query.eventTeams.findFirst({
    where: and(eq(eventTeams.id, teamId), eq(eventTeams.eventId, eventId)),
  });

  return team ?? null;
}

async function assertAccessibleEvent(
  userId: string,
  eventId: string,
  isAdminUser = false,
) {
  if (isAdminUser) {
    const event = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    return event[0] ?? null;
  }

  const organizerEvent = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .innerJoin(
      eventOrganizers,
      and(
        eq(eventOrganizers.eventId, events.id),
        eq(eventOrganizers.organizerId, userId),
      ),
    )
    .where(eq(events.id, eventId))
    .limit(1);

  return organizerEvent[0] ?? null;
}

export async function getOrganizerEventsStats(
  userId: string,
  isAdminUser = false,
) {
  try {
    const baseSelect = {
      eventId: events.id,
      eventTitle: events.title,
      eventStatus: events.status,
      eventType: events.type,
      registeredUsers:
        sql<number>`count(distinct ${eventParticipants.userId})`.mapWith(
          Number,
        ),
      confirmedUsers:
        sql<number>`count(distinct case when ${eventTeams.isComplete} = true then ${eventParticipants.userId} end)`.mapWith(
          Number,
        ),
      totalTeams: sql<number>`count(distinct ${eventTeams.id})`.mapWith(Number),
      confirmedTeams:
        sql<number>`count(distinct case when ${eventTeams.isComplete} = true then ${eventTeams.id} end)`.mapWith(
          Number,
        ),
    };

    const rows = isAdminUser
      ? await db
          .select(baseSelect)
          .from(events)
          .leftJoin(eventTeams, eq(eventTeams.eventId, events.id))
          .leftJoin(
            eventParticipants,
            and(
              eq(eventParticipants.eventId, events.id),
              eq(eventParticipants.teamId, eventTeams.id),
            ),
          )
          .groupBy(events.id)
          .orderBy(asc(events.priority))
      : await db
          .select(baseSelect)
          .from(events)
          .innerJoin(
            eventOrganizers,
            and(
              eq(eventOrganizers.eventId, events.id),
              eq(eventOrganizers.organizerId, userId),
            ),
          )
          .leftJoin(eventTeams, eq(eventTeams.eventId, events.id))
          .leftJoin(
            eventParticipants,
            and(
              eq(eventParticipants.eventId, events.id),
              eq(eventParticipants.teamId, eventTeams.id),
            ),
          )
          .groupBy(events.id)
          .orderBy(asc(events.priority));

    return successResponse(rows, { toast: false });
  } catch (error) {
    console.error("getOrganizerEventsStats Error:", error);
    return errorResponse(
      new AppError("Failed to fetch organizer event stats", 500, {
        title: "Failed to fetch event stats",
      }),
    );
  }
}

export async function getOrganizerEventTeams(
  userId: string,
  eventId: string | null,
  isAdminUser = false,
) {
  try {
    if (!eventId) {
      return errorResponse(
        new AppError("EVENT_ID_REQUIRED", 400, {
          title: "Missing event ID",
          description: "Event ID is required.",
        }),
      );
    }

    const organizerEvent = await assertAccessibleEvent(
      userId,
      eventId,
      isAdminUser,
    );
    if (!organizerEvent) {
      return errorResponse(
        new AppError("EVENT_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You are not an organizer for this event.",
        }),
      );
    }

    const teams = await db
      .select({
        id: eventTeams.id,
        eventId: eventTeams.eventId,
        name: eventTeams.name,
        attended: eventTeams.attended,
        isComplete: eventTeams.isComplete,
        paymentStatus: eventTeams.paymentStatus,
        createdAt: eventTeams.createdAt,
        updatedAt: eventTeams.updatedAt,
        memberCount:
          sql<number>`count(distinct ${eventParticipants.userId})`.mapWith(
            Number,
          ),
        leaderName: sql<
          string | null
        >`max(case when ${eventParticipants.isLeader} = true then ${participants.name} end)`,
        leaderEmail: sql<
          string | null
        >`max(case when ${eventParticipants.isLeader} = true then ${participants.email} end)`,
      })
      .from(eventTeams)
      .leftJoin(eventParticipants, eq(eventParticipants.teamId, eventTeams.id))
      .leftJoin(participants, eq(participants.id, eventParticipants.userId))
      .where(eq(eventTeams.eventId, eventId))
      .groupBy(eventTeams.id)
      .orderBy(asc(eventTeams.name));

    return successResponse(teams, { toast: false });
  } catch (error) {
    console.error("getOrganizerEventTeams Error:", error);
    return errorResponse(
      new AppError("Failed to fetch event teams", 500, {
        title: "Failed to fetch event teams",
      }),
    );
  }
}

export async function getOrganizerAvailableParticipants(
  userId: string,
  eventId: string,
  query = "",
  limit = 20,
  isAdminUser = false,
) {
  try {
    const organizerEvent = await assertAccessibleEvent(
      userId,
      eventId,
      isAdminUser,
    );
    if (!organizerEvent) {
      return errorResponse(
        new AppError("EVENT_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You are not an organizer for this event.",
        }),
      );
    }

    const searchQuery = query.trim();

    const availableParticipants = await db
      .select({
        id: participants.id,
        name: participants.name,
        email: participants.email,
      })
      .from(participants)
      .leftJoin(
        eventParticipants,
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, participants.id),
        ),
      )
      .where(
        and(
          sql`${eventParticipants.id} is null`,
          ...(searchQuery
            ? [
                or(
                  ilike(participants.name, `%${searchQuery}%`),
                  ilike(participants.email, `%${searchQuery}%`),
                ),
              ]
            : []),
        ),
      )
      .orderBy(asc(participants.name))
      .limit(limit);

    return successResponse(availableParticipants, { toast: false });
  } catch (error) {
    console.error("getOrganizerAvailableParticipants Error:", error);
    return errorResponse(
      new AppError("Failed to fetch participant options", 500, {
        title: "Failed to fetch participants",
      }),
    );
  }
}

export async function getOrganizerTeamMembers(
  userId: string,
  eventId: string,
  teamId: string,
  query = "",
  limit = 20,
  isAdminUser = false,
) {
  try {
    const team = await assertAccessibleTeam(
      userId,
      eventId,
      teamId,
      isAdminUser,
    );

    if (!team) {
      return errorResponse(
        new AppError("TEAM_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You cannot access this team.",
        }),
      );
    }

    const searchQuery = query.trim();

    const members = await db
      .select({
        participantId: participants.id,
        name: participants.name,
        email: participants.email,
        phone: participants.phone,
        gender: participants.gender,
        isLeader: eventParticipants.isLeader,
      })
      .from(eventParticipants)
      .innerJoin(participants, eq(participants.id, eventParticipants.userId))
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.teamId, teamId),
          ...(searchQuery
            ? [
                or(
                  ilike(participants.name, `%${searchQuery}%`),
                  ilike(participants.email, `%${searchQuery}%`),
                ),
              ]
            : []),
        ),
      )
      .orderBy(asc(participants.name))
      .limit(limit);

    return successResponse(members, { toast: false });
  } catch (error) {
    console.error("getOrganizerTeamMembers Error:", error);
    return errorResponse(
      new AppError("Failed to fetch team members", 500, {
        title: "Failed to fetch team members",
      }),
    );
  }
}

export async function createOrganizerEventTeam(
  userId: string,
  eventId: string,
  teamName: string,
  isAdminUser = false,
) {
  try {
    const organizerEvent = await assertAccessibleEvent(
      userId,
      eventId,
      isAdminUser,
    );
    if (!organizerEvent) {
      return errorResponse(
        new AppError("EVENT_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You are not an organizer for this event.",
        }),
      );
    }

    const existingTeam = await db.query.eventTeams.findFirst({
      where: and(
        eq(eventTeams.eventId, eventId),
        eq(eventTeams.name, teamName),
      ),
    });

    if (existingTeam) {
      return errorResponse(
        new AppError("TEAM_NAME_EXISTS", 400, {
          title: "Duplicate team name",
          description: "A team with this name already exists in the event.",
        }),
      );
    }

    const [team] = await db
      .insert(eventTeams)
      .values({
        eventId,
        name: teamName,
        isComplete: false,
      })
      .returning();

    return successResponse(team, {
      title: "Team created",
      description: "Event team has been created successfully.",
    });
  } catch (error) {
    console.error("createOrganizerEventTeam Error:", error);
    return errorResponse(
      new AppError("Failed to create event team", 500, {
        title: "Failed to create event team",
      }),
    );
  }
}

export async function updateOrganizerEventTeam(
  userId: string,
  eventId: string,
  teamId: string,
  updates: {
    name?: string;
    attended?: boolean;
    isComplete?: boolean;
  },
  isAdminUser = false,
) {
  try {
    const organizerEvent = await assertAccessibleEvent(
      userId,
      eventId,
      isAdminUser,
    );
    if (!organizerEvent) {
      return errorResponse(
        new AppError("EVENT_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You are not an organizer for this event.",
        }),
      );
    }

    const existingTeam = await db.query.eventTeams.findFirst({
      where: and(eq(eventTeams.id, teamId), eq(eventTeams.eventId, eventId)),
    });

    if (!existingTeam) {
      return errorResponse(
        new AppError("TEAM_NOT_FOUND", 404, {
          title: "Team not found",
          description: "The selected event team does not exist.",
        }),
      );
    }

    if (updates.name && updates.name !== existingTeam.name) {
      const duplicate = await db.query.eventTeams.findFirst({
        where: and(
          eq(eventTeams.eventId, eventId),
          eq(eventTeams.name, updates.name),
        ),
      });

      if (duplicate) {
        return errorResponse(
          new AppError("TEAM_NAME_EXISTS", 400, {
            title: "Duplicate team name",
            description: "A team with this name already exists in the event.",
          }),
        );
      }
    }

    const [updatedTeam] = await db
      .update(eventTeams)
      .set({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.attended !== undefined
          ? { attended: updates.attended }
          : {}),
        ...(updates.isComplete !== undefined
          ? { isComplete: updates.isComplete }
          : {}),
      })
      .where(and(eq(eventTeams.id, teamId), eq(eventTeams.eventId, eventId)))
      .returning();

    return successResponse(updatedTeam, {
      title: "Team updated",
      description: "Event team has been updated successfully.",
    });
  } catch (error) {
    console.error("updateOrganizerEventTeam Error:", error);
    return errorResponse(
      new AppError("Failed to update event team", 500, {
        title: "Failed to update event team",
      }),
    );
  }
}

export async function deleteOrganizerEventTeam(
  userId: string,
  eventId: string,
  teamId: string,
  isAdminUser = false,
) {
  try {
    const organizerEvent = await assertAccessibleEvent(
      userId,
      eventId,
      isAdminUser,
    );
    if (!organizerEvent) {
      return errorResponse(
        new AppError("EVENT_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You are not an organizer for this event.",
        }),
      );
    }

    const [deletedTeam] = await db
      .delete(eventTeams)
      .where(and(eq(eventTeams.id, teamId), eq(eventTeams.eventId, eventId)))
      .returning();

    if (!deletedTeam) {
      return errorResponse(
        new AppError("TEAM_NOT_FOUND", 404, {
          title: "Team not found",
          description: "The selected event team does not exist.",
        }),
      );
    }

    return successResponse(deletedTeam, {
      title: "Team deleted",
      description: "Event team has been deleted successfully.",
    });
  } catch (error) {
    console.error("deleteOrganizerEventTeam Error:", error);
    return errorResponse(
      new AppError("Failed to delete event team", 500, {
        title: "Failed to delete event team",
      }),
    );
  }
}

export async function addOrganizerTeamMember(
  userId: string,
  eventId: string,
  teamId: string,
  participantId: string,
  isAdminUser = false,
) {
  try {
    const team = await assertAccessibleTeam(
      userId,
      eventId,
      teamId,
      isAdminUser,
    );

    if (!team) {
      return errorResponse(
        new AppError("TEAM_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You cannot manage this team.",
        }),
      );
    }

    const normalizedParticipantId = participantId.trim();
    if (!normalizedParticipantId) {
      return errorResponse(
        new AppError("INVALID_PARTICIPANT", 400, {
          title: "Invalid participant",
          description: "Participant is required.",
        }),
      );
    }

    const participant = await db.query.participants.findFirst({
      where: eq(participants.id, normalizedParticipantId),
    });

    if (!participant) {
      return errorResponse(
        new AppError("PARTICIPANT_NOT_FOUND", 404, {
          title: "Participant not found",
          description: "Selected participant does not exist.",
        }),
      );
    }

    const existingEventMembership = await db.query.eventParticipants.findFirst({
      where: and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.userId, participant.id),
      ),
    });

    if (existingEventMembership) {
      if (existingEventMembership.teamId === teamId) {
        return errorResponse(
          new AppError("ALREADY_IN_TEAM", 400, {
            title: "Already in team",
            description: "This participant is already in the selected team.",
          }),
        );
      }

      return errorResponse(
        new AppError("ALREADY_ASSIGNED", 400, {
          title: "Already assigned",
          description:
            "This participant is already assigned to another team in this event.",
        }),
      );
    }

    const [member] = await db
      .insert(eventParticipants)
      .values({
        eventId,
        teamId,
        userId: participant.id,
      })
      .returning();

    return successResponse(member, {
      title: "Member added",
      description: "Participant has been added to the team.",
    });
  } catch (error) {
    console.error("addOrganizerTeamMember Error:", error);
    return errorResponse(
      new AppError("Failed to add team member", 500, {
        title: "Failed to add team member",
      }),
    );
  }
}

export async function setOrganizerTeamLeader(
  userId: string,
  eventId: string,
  teamId: string,
  participantId: string,
  isAdminUser = false,
) {
  try {
    const team = await assertAccessibleTeam(
      userId,
      eventId,
      teamId,
      isAdminUser,
    );

    if (!team) {
      return errorResponse(
        new AppError("TEAM_ACCESS_DENIED", 403, {
          title: "Access denied",
          description: "You cannot manage this team.",
        }),
      );
    }

    const normalizedParticipantId = participantId.trim();
    if (!normalizedParticipantId) {
      return errorResponse(
        new AppError("INVALID_PARTICIPANT", 400, {
          title: "Invalid participant",
          description: "Participant is required.",
        }),
      );
    }

    const participant = await db.query.participants.findFirst({
      where: eq(participants.id, normalizedParticipantId),
    });

    if (!participant) {
      return errorResponse(
        new AppError("PARTICIPANT_NOT_FOUND", 404, {
          title: "Participant not found",
          description: "Selected participant does not exist.",
        }),
      );
    }

    const membership = await db.query.eventParticipants.findFirst({
      where: and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.teamId, teamId),
        eq(eventParticipants.userId, participant.id),
      ),
    });

    if (!membership) {
      return errorResponse(
        new AppError("MEMBER_NOT_IN_TEAM", 400, {
          title: "Member not in team",
          description:
            "Add this participant to the team before assigning leader.",
        }),
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(eventParticipants)
        .set({ isLeader: false })
        .where(
          and(
            eq(eventParticipants.eventId, eventId),
            eq(eventParticipants.teamId, teamId),
          ),
        );

      await tx
        .update(eventParticipants)
        .set({ isLeader: true })
        .where(eq(eventParticipants.id, membership.id));
    });

    return successResponse(
      { teamId, participantId: participant.id },
      {
        title: "Leader assigned",
        description: "Team leader has been updated.",
      },
    );
  } catch (error) {
    console.error("setOrganizerTeamLeader Error:", error);
    return errorResponse(
      new AppError("Failed to set team leader", 500, {
        title: "Failed to set team leader",
      }),
    );
  }
}
