import { toast } from "sonner";
import type z from "zod";
import type { TeamDetails } from "~/db/services/manage-event";
import { apiFetch } from "~/lib/fetcher";
import type { eventSchema } from "~/lib/validation/event";

export type EventData = {
  from: Date;
  to: Date;
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
  registrationsOpen: boolean;
  amount: number;
  priority: number;
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  organizerIds?: string[];
};

export type EventTeam = {
  id: string;
  name: string;
  paymentStatus: "Pending" | "Paid" | "Refunded" | null;
  eventId: string;
  attended: boolean;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizerEventStat = {
  eventId: string;
  eventTitle: string;
  eventStatus: "Draft" | "Published" | "Ongoing" | "Completed";
  eventType: "Solo" | "Team";
  registeredUsers: number;
  confirmedUsers: number;
  totalTeams: number;
  confirmedTeams: number;
};

export type OrganizerEventTeam = EventTeam & {
  memberCount: number;
  leaderName: string | null;
  leaderEmail: string | null;
};

export type OrganizerOption = {
  id: string;
  name: string;
  username: string;
  email: string | null;
};

export type ParticipantOption = {
  id: string;
  name: string | null;
  email: string | null;
};

export type TeamMemberOption = {
  participantId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  isLeader: boolean;
};

export async function createEvent(
  formData: z.infer<typeof eventSchema>,
): Promise<boolean> {
  try {
    const data = await apiFetch<EventData>("/api/dashboard/events/create", {
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

export async function updateEventStatus(
  eventId: string,
  status: string,
): Promise<EventData | null> {
  try {
    const data = await apiFetch<EventData>(
      "/api/dashboard/events/updateStatus",
      {
        method: "POST",
        body: JSON.stringify({ eventId, newStatus: status }),
      },
    );

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

export async function updateEvent(
  eventId: string,
  formData: z.infer<typeof eventSchema>,
): Promise<EventData | null> {
  try {
    const data = await apiFetch<EventData>("/api/dashboard/events/update", {
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

export async function toggleAttendance(
  teamId: string,
  attended: boolean,
): Promise<boolean> {
  try {
    const response = await apiFetch<boolean>(
      "/api/dashboard/events/updateAttendance",
      {
        method: "POST",
        body: JSON.stringify({ teamId, attended }),
      },
    );

    return response;
  } catch (_error) {
    return false;
  }
}

export async function toggleParticipantAttendance(
  participantId: string,
  attended: boolean,
): Promise<boolean> {
  try {
    const response = await apiFetch<boolean>(
      "/api/dashboard/events/updateParticipantAttendance",
      {
        method: "POST",
        body: JSON.stringify({ participantId, attended }),
      },
    );

    return response;
  } catch (_error) {
    return false;
  }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const response = await apiFetch<EventData | null>(
      "/api/dashboard/events/delete",
      {
        method: "DELETE",
        body: JSON.stringify({ eventId }),
      },
    );

    if (!response) {
      return false;
    }

    return true;
  } catch (_error) {
    return false;
  }
}

export async function fetchAllEvents(assigned: boolean): Promise<EventData[]> {
  try {
    const data = await apiFetch<EventData[]>(
      `/api/dashboard/events/${assigned ? "getAllAssigned" : "getAll"}`,
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function reorderEvents(orderedIds: string[]): Promise<boolean> {
  try {
    await apiFetch("/api/dashboard/events/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds }),
    });
    return true;
  } catch (_error) {
    toast.error("Failed to reorder events");
    return false;
  }
}

export async function getEventById(eventId: string): Promise<EventData | null> {
  try {
    const data = await apiFetch<EventData>(
      `/api/dashboard/events/getById?id=${eventId}`,
    );
    if (!data) {
      return null;
    }
    return data;
  } catch (_error) {
    return null;
  }
}

export async function getEventTeams(eventId: string): Promise<EventTeam[]> {
  try {
    const data = await apiFetch<EventTeam[]>(
      `/api/dashboard/events/getEventTeams?id=${eventId}`,
      {
        method: "GET",
      },
    );

    if (!data) {
      return [] as EventTeam[];
    }

    return data;
  } catch (_error) {
    return [] as EventTeam[];
  }
}

export async function getTeamDetails(
  teamId: string,
): Promise<TeamDetails | null> {
  try {
    const data = await apiFetch<TeamDetails>(
      `/api/dashboard/events/getTeamDetails?id=${teamId}`,
      {
        method: "GET",
      },
    );

    if (!data) {
      return null;
    }

    return data;
  } catch (_error) {
    return null;
  }
}

export async function getOrganizerEventStats(): Promise<OrganizerEventStat[]> {
  try {
    const data = await apiFetch<OrganizerEventStat[]>(
      "/api/dashboard/events/getOrganizerEventStats",
      {
        method: "GET",
      },
    );

    return data || [];
  } catch (_error) {
    return [];
  }
}

export async function getOrganizerEventTeams(
  eventId: string,
): Promise<OrganizerEventTeam[]> {
  try {
    const data = await apiFetch<OrganizerEventTeam[]>(
      `/api/dashboard/events/getOrganizerEventTeams?id=${eventId}`,
      {
        method: "GET",
      },
    );

    return data || [];
  } catch (_error) {
    return [];
  }
}

export async function getAssignableOrganizers(): Promise<OrganizerOption[]> {
  try {
    const data = await apiFetch<OrganizerOption[]>(
      "/api/dashboard/events/getAssignableOrganizers",
      {
        method: "GET",
      },
    );

    return data || [];
  } catch (_error) {
    return [];
  }
}

export async function createOrganizerEventTeam(
  eventId: string,
  name: string,
): Promise<OrganizerEventTeam | null> {
  try {
    const data = await apiFetch<OrganizerEventTeam>(
      "/api/dashboard/events/createOrganizerEventTeam",
      {
        method: "POST",
        body: JSON.stringify({ eventId, name }),
      },
    );

    return data;
  } catch (_error) {
    return null;
  }
}

export async function updateOrganizerEventTeam(
  eventId: string,
  teamId: string,
  payload: {
    name?: string;
    attended?: boolean;
    isComplete?: boolean;
  },
): Promise<OrganizerEventTeam | null> {
  try {
    const data = await apiFetch<OrganizerEventTeam>(
      "/api/dashboard/events/updateOrganizerEventTeam",
      {
        method: "POST",
        body: JSON.stringify({ eventId, teamId, ...payload }),
      },
    );

    return data;
  } catch (_error) {
    return null;
  }
}

export async function deleteOrganizerEventTeam(
  eventId: string,
  teamId: string,
): Promise<boolean> {
  try {
    await apiFetch<OrganizerEventTeam>(
      "/api/dashboard/events/deleteOrganizerEventTeam",
      {
        method: "DELETE",
        body: JSON.stringify({ eventId, teamId }),
      },
    );

    return true;
  } catch (_error) {
    return false;
  }
}

export async function addOrganizerTeamMember(
  eventId: string,
  teamId: string,
  participantId: string,
): Promise<boolean> {
  try {
    await apiFetch("/api/dashboard/events/addOrganizerTeamMember", {
      method: "POST",
      body: JSON.stringify({ eventId, teamId, participantId }),
    });

    return true;
  } catch (_error) {
    return false;
  }
}

export async function setOrganizerTeamLeader(
  eventId: string,
  teamId: string,
  participantId: string,
): Promise<boolean> {
  try {
    await apiFetch("/api/dashboard/events/setOrganizerTeamLeader", {
      method: "POST",
      body: JSON.stringify({ eventId, teamId, participantId }),
    });

    return true;
  } catch (_error) {
    return false;
  }
}

export async function getOrganizerAvailableParticipants(
  eventId: string,
  query = "",
): Promise<ParticipantOption[]> {
  try {
    const q = encodeURIComponent(query);
    const data = await apiFetch<ParticipantOption[]>(
      `/api/dashboard/events/getOrganizerAvailableParticipants?id=${eventId}&q=${q}`,
      {
        method: "GET",
      },
    );

    return data || [];
  } catch (_error) {
    return [];
  }
}

export async function getOrganizerTeamMembers(
  eventId: string,
  teamId: string,
  query = "",
): Promise<TeamMemberOption[]> {
  try {
    const q = encodeURIComponent(query);
    const data = await apiFetch<TeamMemberOption[]>(
      `/api/dashboard/events/getOrganizerTeamMembers?eventId=${eventId}&teamId=${teamId}&q=${q}`,
      {
        method: "GET",
      },
    );

    return data || [];
  } catch (_error) {
    return [];
  }
}
