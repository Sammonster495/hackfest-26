import { query } from "~/db/data";

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

export async function getAllEvents() {
  return query.events.findMany({
    where: (events, { eq, not }) => not(eq(events.status, "Draft")),
    orderBy: (events, { desc }) => desc(events.date),
  });
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
