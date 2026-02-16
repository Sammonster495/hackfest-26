import { query } from "~/db/data";
import { successResponse } from "~/lib/response/success";

export type GetAllEventsResponse = {
  success: boolean;
  data?: {
    date: Date;
    id: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
    type: "Solo" | "Team";
    title: string;
    description: string;
    venue: string;
    deadline: Date;
    status: "Draft" | "Published" | "Ongoing" | "Completed";
    maxTeams: number;
    minTeamSize: number;
    maxTeamSize: number;
  }[];
  error?: string;
};

export async function getAllEvents(userId?: string) {
  const events = await query.events.findMany({
    where: (events, { eq, not }) => not(eq(events.status, "Draft")),
    orderBy: (events, { desc }) => desc(events.date),
  });

  if (!userId) return successResponse({ events }, { toast: false });

  const userEvents = await query.eventParticipants.findMany({
    where: (eventParticipants, { eq }) => eq(eventParticipants.userId, userId),
  });

  const res = events.map(async (e) => {
    const userEvent = userEvents.find((ue) => ue.eventId === e.id);

    if (!userEvent) return { ...e, userStatus: "NOT_REGISTERED" };

    if (e.type === "Solo") return { ...e, userStatus: "REGISTERED" };

    const team = await query.eventTeams.findOne({
      where: (eventTeams, { eq }) => eq(eventTeams.id, userEvent.teamId),
    });

    const eventMembers = await query.eventParticipants.findMany({
      where: (eventParticipants, { eq }) =>
        eq(eventParticipants.teamId, team?.id ?? ""),
    });

    return {
      ...e,
      userStatus: team?.isComplete ? "TEAM_REGISTERED" : "PENDING_CONFIRMATION",
      isTeamLeader: userEvent.isLeader,
      teamMembers: eventMembers.map((em) => em.userId),
    };
  });

  return successResponse({ events: await Promise.all(res) }, { toast: false });
}

export async function getAllEventsForAdmin(): Promise<GetAllEventsResponse> {
  try {
    const events = await query.events.findMany({
      orderBy: (events, { desc }) => desc(events.date),
    });

    return {
      success: true,
      data: events,
    } as GetAllEventsResponse;
  } catch (error) {
    console.error("getAllEventsForAdmin Error:", error);
    return {
      success: false,
      error: "Failed to fetch events for admin.",
    } as GetAllEventsResponse;
  }
}
