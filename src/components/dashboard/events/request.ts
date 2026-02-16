import { toast } from "sonner";
import type z from "zod";
import type { GetAllEventsResponse } from "~/db/data/events";
import { events } from "~/db/schema";
import { apiFetch } from "~/lib/fetcher";
import type { eventSchema } from "~/lib/validation/event";

export type EventData = {
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
};

export async function fetchAllEvents() {
  try {
    const data = await apiFetch<GetAllEventsResponse["data"]>(
      "/api/events/getAllForAdmin",
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function updateEventStatus(
  eventId: string,
  status: string,
): Promise<EventData | null> {
  try {
    const data = await apiFetch<EventData>("/api/events/updateStatus", {
      method: "POST",
      body: JSON.stringify({ eventId, newStatus: status }),
    });

    if (!data) {
      console.error("No data returned from update status API");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating event status:", error);
    return null;
  }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const response = await apiFetch<EventData | null>("/api/events/delete", {
      method: "DELETE",
      body: JSON.stringify({ eventId }),
    });

    if (!response) {
      return false;
    }

    return true;
  } catch (_error) {
    return false;
  }
}

export async function createEvent(
  formData: z.infer<typeof eventSchema>,
): Promise<boolean> {
  try {
    const data = await apiFetch<EventData>("/api/events/create", {
      method: "PUT",
      body: JSON.stringify(formData),
    });

    if (!data) {
      return false;
    }

    return true;
  } catch (_error) {
    toast.error("Failed to create event. Please try again.");
    return false;
  }
}

export async function getEventById(eventId: string): Promise<EventData | null> {
  try {
    const data = await apiFetch<EventData>(
      `/api/events/getAllById?id=${eventId}`,
    );
    if (!data) {
      return null;
    }
    return data;
  } catch (_error) {
    return null;
  }
}

export async function updateEvent(
  eventId: string,
  formData: z.infer<typeof eventSchema>,
): Promise<EventData | null> {
  try {
    const data = await apiFetch<EventData>("/api/events/update", {
      method: "POST",
      body: JSON.stringify({ id: eventId, data: formData }),
    });

    if (!data) {
      return null;
    }

    return data;
  } catch (_error) {
    return null;
  }
}
