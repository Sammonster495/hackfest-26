import { and, eq } from "drizzle-orm";
import db from "~/db";
import {
  findByEvent,
  findById,
  findLeaderByTeam,
  findUserParticipations,
  type UserParticipation,
  updateById,
} from "~/db/data/event-users";
import { eventParticipants, eventTeams } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import {
  type UpdateEventUserInput,
  updateEventUserSchema,
} from "~/lib/validation/event";
import {
  eventRegistrationOpen,
  findAllPublishedEvents,
  findByEventId,
} from "../data/event";
import { findByIdandEvent, memberCount, teamCount } from "../data/event-teams";

export async function getAllEvents(userId?: string) {
  const registrationsOpen = await eventRegistrationOpen();
  const events = await findAllPublishedEvents();

  let participations: Record<string, UserParticipation> = {};

  if (userId) {
    participations = await findUserParticipations(userId);
  }

  const formattedEvents = events.map((e) => {
    const participation = userId ? (participations[e.id] ?? null) : null;

    let userStatus:
      | "registered"
      | "not_confirmed"
      | "not_registered"
      | undefined;

    if (userId) {
      userStatus = participation?.team
        ? participation.team.isComplete
          ? "registered"
          : "not_confirmed"
        : "not_registered";
    }

    return {
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      image: e.image,
      venue: e.venue,
      description: e.description,
      type: e.type as "Solo" | "Team",
      status: e.status as "Draft" | "Published" | "Ongoing" | "Completed",
      audience: e.audience as "Participants" | "Non-Participants" | "Both",
      category: e.category,
      deadline: e.deadline.toISOString(),
      minTeamSize: e.minTeamSize,
      maxTeamSize: e.maxTeamSize,
      maxTeams: e.maxTeams,
      amount: e.amount,
      organizers: e.organizers,
      ...(userId && {
        userStatus,
        team: participation?.team ?? null,
        isLeader: participation?.isLeader ?? false,
        teamMembers: participation?.teamMembers ?? [],
      }),
    };
  });

  return successResponse(
    {
      events: formattedEvents,
      registrationsOpen,
    },
    {
      toast: false,
      title: "Events fetched",
    },
  );
}

export async function updateUserDetails(
  userId: string,
  data: UpdateEventUserInput,
) {
  const payload = updateEventUserSchema.parse(data);
  const user = await findById(userId);

  if (user?.gender || user?.state || user?.collegeId) {
    return errorResponse(
      new AppError("USER_DETAILS_ALREADY_SET", 400, {
        title: "User details already set",
        description:
          "You have already set your user details. You cannot update them again.",
      }),
    );
  }

  const updatedUser = await updateById(userId, payload);

  if (!updatedUser) {
    return errorResponse(
      new AppError("USER_UPDATE_FAILED", 500, {
        title: "User update failed",
        description:
          "An error occurred while updating your your details. Please try again.",
      }),
    );
  }

  return successResponse(
    { user: updatedUser },
    {
      title: "User details updated",
      description: "Your user details have been updated successfully.",
    },
  );
}

export async function soloRegistrationChecker(
  eventId: string,
  userId: string,
  action: string,
) {
  const eventUser = await findByEvent(eventId, userId);
  const team = eventUser
    ? await findByIdandEvent(eventId, eventUser.teamId)
    : null;
  switch (action) {
    case "register":
      if (eventUser) {
        if (team?.isComplete)
          return new AppError("ALREADY_REGISTERED_CONFIRMED", 400, {
            title: "Already registered",
            description: "You are already registered for this event.",
          });
        return new AppError("REGISTERATION_INITIATED", 400, {
          title: "Registration initiated",
          description:
            "You have already initiated registration for this event.",
        });
      }
      break;
    case "cancel":
      if (!eventUser) {
        return new AppError("NOT_REGISTERED", 400, {
          title: "Not registered",
          description: "You are not registered for this event.",
        });
      }
      break;
    default:
      return new AppError("Unknown action", 400, {
        title: "Unknown Action",
        description: "The specified action is not recognized.",
      });
  }

  return eventUser;
}

export async function registerSoloEvent(
  eventId: string,
  userId: string,
  teamName: string,
) {
  const event = await findByEventId(eventId);
  const teams = await teamCount(eventId);

  if (event && teams >= event.maxTeams)
    return errorResponse(
      new AppError("MAX_REGISTRATIONS_REACHED", 400, {
        title: "Max registrations reached",
        description:
          "The maximum number of registrations for this event has been reached.",
      }),
    );

  const eventTeam = await db.transaction(async (tx) => {
    const [team] = await tx
      .insert(eventTeams)
      .values({
        eventId: eventId,
        name: teamName,
        isComplete: event?.amount === 0,
      })
      .returning();

    await tx.insert(eventParticipants).values({
      eventId: eventId,
      teamId: team.id,
      userId: userId,
      isLeader: true,
    });

    return team;
  });

  if (!eventTeam) {
    return errorResponse(
      new AppError("REGISTRATION_FAILED", 500, {
        title: "Registration failed",
        description:
          "An error occurred while registering for the event. Please try again.",
      }),
    );
  }

  return successResponse(
    { team: eventTeam },
    {
      title: event?.amount === 0 ? "Registered" : "Registration Initiated",
      description: `You have ${event?.amount === 0 ? "registered" : "initiated registration"} for the event successfully.`,
    },
  );
}

export async function cancelSoloEvent(teamId: string) {
  const deletedTeam = await db.transaction(async (tx) => {
    return await tx
      .delete(eventTeams)
      .where(eq(eventTeams.id, teamId))
      .returning();
  });

  if (!deletedTeam)
    return errorResponse(
      new AppError("REGISTRATION_CANCELLATION_FAILED", 500, {
        title: "Registration cancellation failed",
        description:
          "An error occurred while cancelling your registration. Please try again.",
      }),
    );

  return successResponse(
    { team: deletedTeam[0] },
    {
      title: "Registration Cancelled",
      description: "Your registration has been cancelled successfully.",
    },
  );
}

export async function teamRegistrationChecker(
  eventId: string,
  userId: string,
  action: string,
) {
  const eventUser = await findByEvent(eventId, userId);
  switch (action) {
    case "create":
    case "join":
      if (eventUser) {
        return new AppError("ALREADY_REGISTERED", 400, {
          title: "Already registered",
          description: "You are already registered for this event.",
        });
      }
      break;
    case "leave":
    case "kick":
    case "confirm":
    case "delete":
      if (!eventUser) {
        return new AppError("NOT_REGISTERED", 400, {
          title: "Not registered",
          description: "You are not registered for this event.",
        });
      }
      break;
    default:
      return new AppError("Unknown action", 400, {
        title: "Unknown Action",
        description: "The specified action is not recognized.",
      });
  }

  return eventUser;
}

export async function createEventTeam(
  eventId: string,
  userId: string,
  teamName: string,
) {
  const event = await findByEventId(eventId);
  const teams = await teamCount(eventId);

  if (event && teams >= event.maxTeams)
    return errorResponse(
      new AppError("MAX_TEAMS_REACHED", 400, {
        title: "Max teams reached",
        description:
          "The maximum number of teams for this event has been reached.",
      }),
    );

  const eventTeam = await db.transaction(async (tx) => {
    const [team] = await tx
      .insert(eventTeams)
      .values({
        eventId: eventId,
        name: teamName,
        isComplete: false,
      })
      .returning();

    await tx.insert(eventParticipants).values({
      eventId: eventId,
      teamId: team.id,
      userId: userId,
      isLeader: true,
    });

    return team;
  });

  if (!eventTeam) {
    return errorResponse(
      new AppError("TEAM_CREATION_FAILED", 500, {
        title: "Team creation failed",
        description:
          "An error occurred while creating the team. Please try again.",
      }),
    );
  }

  return successResponse(
    { team: eventTeam },
    {
      title: "Team Created",
      description: "Your team has been created successfully.",
    },
  );
}

export async function leaveEventTeam(
  eventId: string,
  teamId: string,
  userId: string,
) {
  const participant = await findByEvent(eventId, userId);

  if (!participant)
    return errorResponse(
      new AppError("NOT_IN_TEAM", 400, {
        title: "Not in team",
        description: "You are not a member of this team.",
      }),
    );

  const team = await findByIdandEvent(eventId, teamId);

  if (team?.isComplete)
    return errorResponse(
      new AppError("TEAM_ALREADY_CONFIRMED", 400, {
        title: "Team already confirmed",
        description: "You cannot leave a team that has already been confirmed.",
      }),
    );

  const leftTeam = await db.transaction(async (tx) => {
    return await tx
      .delete(eventParticipants)
      .where(
        and(
          eq(eventParticipants.id, participant.id),
          eq(eventParticipants.teamId, teamId),
        ),
      )
      .returning();
  });

  if (!leftTeam)
    return errorResponse(
      new AppError("LEAVE_TEAM_FAILED", 500, {
        title: "Leave team failed",
        description:
          "An error occurred while leaving the team. Please try again.",
      }),
    );

  return successResponse(
    { team: leftTeam[0] },
    {
      title: "Left Team",
      description: "You have left the team successfully.",
    },
  );
}

export async function joinEventTeam(
  eventId: string,
  userId: string,
  collegeId: string,
  teamId: string,
) {
  const team = await findByIdandEvent(eventId, teamId);

  if (!team)
    return errorResponse(
      new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you are trying to join does not exist.",
      }),
    );

  const event = await findByEventId(eventId);
  const leader = await findLeaderByTeam(teamId);
  const leaderCollegeId = (await findById(leader?.userId ?? ""))?.collegeId;

  if (leaderCollegeId !== collegeId)
    return errorResponse(
      new AppError("COLLEGE_MISMATCH", 400, {
        title: "College mismatch",
        description: "You can only join teams from your own college.",
      }),
    );

  const members = await memberCount(eventId, teamId);

  if (event && members === event.maxTeamSize)
    return errorResponse(
      new AppError("TEAM_FULL", 400, {
        title: "Team full",
        description:
          "This team has already reached the maximum number of members.",
      }),
    );

  if (team.isComplete)
    return errorResponse(
      new AppError("TEAM_ALREADY_CONFIRMED", 400, {
        title: "Team already confirmed",
        description: "You cannot join a team that has already been confirmed.",
      }),
    );

  const participant = await db.transaction(async (tx) => {
    return await tx
      .insert(eventParticipants)
      .values({
        eventId: eventId,
        teamId: teamId,
        userId: userId,
        isLeader: false,
      })
      .returning();
  });

  if (!participant)
    return errorResponse(
      new AppError("JOIN_TEAM_FAILED", 500, {
        title: "Join team failed",
        description:
          "An error occurred while joining the team. Please try again.",
      }),
    );

  return successResponse(
    { team: participant },
    {
      title: "Joined Team",
      description: "You have joined the team successfully.",
    },
  );
}

export async function kickMemberFromTeam(
  eventId: string,
  teamId: string,
  userId: string,
  memberId: string,
) {
  if (!teamId)
    return errorResponse(
      new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you are trying to kick from does not exist.",
      }),
    );

  const leader = await findLeaderByTeam(teamId);

  if (leader?.userId !== userId)
    return errorResponse(
      new AppError("NOT_TEAM_LEADER", 403, {
        title: "Not team leader",
        description: "Only the team leader can kick members from the team.",
      }),
    );

  const member = findByEvent(eventId, memberId);

  if (!member)
    return errorResponse(
      new AppError("MEMBER_NOT_FOUND", 404, {
        title: "Member not found",
        description: "The member you are trying to kick does not exist.",
      }),
    );

  const team = await findByIdandEvent(eventId, teamId);

  if (team?.isComplete)
    return errorResponse(
      new AppError("TEAM_ALREADY_CONFIRMED", 400, {
        title: "Team already confirmed",
        description:
          "You cannot kick members from a team that has already been confirmed.",
      }),
    );

  const kickedMember = await db.transaction(async (tx) => {
    return await tx
      .delete(eventParticipants)
      .where(
        and(
          eq(eventParticipants.id, memberId),
          eq(eventParticipants.teamId, teamId),
        ),
      )
      .returning();
  });

  if (!kickedMember)
    return errorResponse(
      new AppError("KICK_MEMBER_FAILED", 500, {
        title: "Kick member failed",
        description:
          "An error occurred while kicking the member from the team. Please try again.",
      }),
    );

  return successResponse(
    { team: kickedMember[0] },
    {
      title: "Member Kicked",
      description: "The member has been kicked from the team successfully.",
    },
  );
}

export async function confirmEventTeam(
  eventId: string,
  teamId: string,
  userId: string,
) {
  if (!teamId)
    return errorResponse(
      new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you are trying to confirm does not exist.",
      }),
    );

  const event = await findByEventId(eventId);
  const members = await memberCount(eventId, teamId);

  if (event && members < event.minTeamSize)
    return errorResponse(
      new AppError("MIN_TEAM_SIZE_NOT_MET", 400, {
        title: "Minimum team size not met",
        description: `Your team must have at least ${event.minTeamSize} members to be confirmed.`,
      }),
    );

  const leader = await findLeaderByTeam(teamId);

  if (leader?.userId !== userId)
    return errorResponse(
      new AppError("NOT_TEAM_LEADER", 403, {
        title: "Not team leader",
        description: "Only the team leader can confirm the team.",
      }),
    );

  const teams = await teamCount(eventId);

  if (event && teams >= event.maxTeams)
    return errorResponse(
      new AppError("MAX_TEAMS_REACHED", 400, {
        title: "Max teams reached",
        description:
          "The maximum number of teams for this event has been reached.",
      }),
    );

  const [updatedTeam] = await db.transaction(async (tx) => {
    return await tx
      .update(eventTeams)
      .set({ isComplete: true })
      .where(eq(eventTeams.id, teamId))
      .returning();
  });

  return successResponse(
    { team: updatedTeam },
    {
      title: "Team Confirmed",
      description: "Your team has been confirmed successfully.",
    },
  );
}

export async function deleteEventTeam(teamId: string, userId: string) {
  if (!teamId)
    return errorResponse(
      new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you are trying to delete does not exist.",
      }),
    );

  const participant = await findLeaderByTeam(teamId);

  if (participant?.userId !== userId)
    return errorResponse(
      new AppError("NOT_TEAM_LEADER", 403, {
        title: "Not team leader",
        description: "Only the team leader can delete the team.",
      }),
    );

  const deletedTeam = await db.transaction(async (tx) => {
    return await tx
      .delete(eventTeams)
      .where(eq(eventTeams.id, teamId))
      .returning();
  });

  if (!deletedTeam)
    return errorResponse(
      new AppError("DELETE_TEAM_FAILED", 500, {
        title: "Delete team failed",
        description:
          "An error occurred while deleting the team. Please try again.",
      }),
    );

  return successResponse(
    { team: deletedTeam[0] },
    {
      title: "Team Deleted",
      description: "Your team has been deleted successfully.",
    },
  );
}
