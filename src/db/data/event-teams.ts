import { count, eq } from "drizzle-orm";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import db from "..";
import { eventParticipants, eventTeams } from "../schema";
import { query } from ".";
import { deleteParticipant } from "./event-users";

export async function createEventTeam(
  eventId: string,
  userId: string,
  teamName: string,
  confirm = false,
) {
  const event = await query.events.findOne({
    where: (e, { and, eq, not }) =>
      and(eq(e.id, eventId), not(eq(e.status, "Draft"))),
  });

  const teamCount =
    (
      await db
        .select({ value: count() })
        .from(eventTeams)
        .where(eq(eventTeams.eventId, eventId))
    )[0].value ?? 0;

  if (event && teamCount >= event.maxTeams)
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
        isComplete: confirm,
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
  console.log("Created team:", eventTeam);

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

  return successResponse(
    { team: await deleteParticipant(participant.id) },
    {
      title: "Left Team",
      description: "You have left the team successfully.",
    },
  );
}

export async function joinEventTeam(
  eventId: string,
  teamId: string,
  userId: string,
) {
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

  return successResponse(
    { team: participant },
    {
      title: "Joined Team",
      description: "You have joined the team successfully.",
    },
  );
}

export async function confirmEventTeam(eventId: string, teamId: string) {
  const event = await query.events.findOne({
    where: (e, { eq }) => eq(e.id, eventId),
  });
  const memberCount =
    (
      await db
        .select({ value: count() })
        .from(eventParticipants)
        .where(eq(eventParticipants.teamId, teamId))
    )[0].value ?? 0;

  if (event && memberCount < event.minTeamSize)
    return errorResponse(
      new AppError("MIN_TEAM_SIZE_NOT_MET", 400, {
        title: "Minimum team size not met",
        description: `Your team must have at least ${event.minTeamSize} members to be confirmed.`,
      }),
    );

  return successResponse(
    { team: await query.eventTeams.update(teamId, { isComplete: true }) },
    {
      title: "Team Confirmed",
      description: "Your team has been confirmed successfully.",
    },
  );
}

export async function deleteEventTeam(teamId: string) {
  return successResponse(
    { team: await query.eventTeams.delete(teamId) },
    {
      title: "Team Deleted",
      description: "Your team has been deleted successfully.",
    },
  );
}
