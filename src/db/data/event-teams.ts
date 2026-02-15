import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import db from "..";
import { eventParticipants, eventTeams } from "../schema";
import { query } from ".";
import { deleteParticipant, findByEvent } from "./event-users";

export async function createEventTeam(
  eventId: string,
  userId: string,
  teamName: string,
) {
  const eventUser = await findByEvent(eventId, userId);

  if (eventUser)
    return errorResponse(
      new AppError("ALREADY_REGISTERED", 400, {
        title: "Already registered",
        description: "You are already registered for this event.",
      }),
    );

  const eventTeam = db.transaction(async (tx) => {
    const [team] = await tx
      .insert(eventTeams)
      .values({
        eventId: eventId,
        name: teamName,
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

  return eventTeam;
}

export async function leaveEventTeam(
  eventId: string,
  teamId: string,
  userId: string,
) {
  const eventUser = await findByEvent(eventId, userId);

  if (!eventUser)
    return errorResponse(
      new AppError("NOT_REGISTERED", 400, {
        title: "Not registered",
        description: "You are not registered for this event.",
      }),
    );

  const participant = await query.eventParticipants.findOne({
    where: (p, { and, eq }) =>
      and(eq(p.eventId, eventId), eq(p.teamId, teamId), eq(p.userId, userId)),
  });

  if (!participant)
    return errorResponse(
      new AppError("NOT_IN_TEAM", 400, {
        title: "Not in team",
        description: "You are not a member of this team.",
      }),
    );

  return deleteParticipant(participant.id);
}

export async function joinEventTeam(
  eventId: string,
  teamId: string,
  userId: string,
) {
  const eventUser = await findByEvent(eventId, userId);

  if (eventUser)
    return errorResponse(
      new AppError("ALREADY_REGISTERED", 400, {
        title: "Already registered",
        description: "You are already registered for this event.",
      }),
    );

  const team = await query.eventTeams.findOne({
    where: (t, { and, eq }) => and(eq(t.id, teamId), eq(t.eventId, eventId)),
  });

  if (!team)
    return errorResponse(
      new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you are trying to join does not exist.",
      }),
    );

  const participant = await query.eventParticipants.insert({
    eventId: eventId,
    teamId: teamId,
    userId: userId,
    isLeader: false,
  });

  if (!participant)
    return errorResponse(
      new AppError("JOIN_TEAM_FAILED", 500, {
        title: "Join team failed",
        description:
          "An error occurred while joining the team. Please try again.",
      }),
    );

  return participant;
}

export async function deleteEventTeam(
  eventId: string,
  teamId: string,
  userId: string,
) {
  const eventUser = await findByEvent(eventId, userId);

  if (!eventUser)
    return errorResponse(
      new AppError("NOT_REGISTERED", 400, {
        title: "Not registered",
        description: "You are not registered for this event.",
      }),
    );

  if (!eventUser.isLeader)
    return errorResponse(
      new AppError("NOT_TEAM_LEADER", 403, {
        title: "Not team leader",
        description: "Only the team leader can delete the team.",
      }),
    );

  return query.eventTeams.delete(teamId);
}
