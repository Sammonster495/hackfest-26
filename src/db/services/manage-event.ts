import { desc, eq } from "drizzle-orm";
import type { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { query } from "~/db/data";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import { eventSchema } from "~/lib/validation/event";
import db from "..";
import type { eventStatusEnum } from "../enum";
import { eventParticipants, events, eventTeams } from "../schema";

export type TeamDetails = {
  id: string;
  name: string;
  paymentStatus: "Pending" | "Paid" | "Refunded" | null;
  attended: boolean;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  college: string;
  state: string;
  members: {
    userId: string;
    participantId: string;
    name: string | null;
    email: string | null;
    isLeader: boolean;
    college: string;
    state: string;
    gender: string;
    attended: boolean;
  }[];
};

export async function getAllEventsForAdmin({
  assigned = false,
  session,
}: {
  assigned?: boolean;
  session?: Session;
}): Promise<NextResponse> {
  try {
    let events: {
      type: "Solo" | "Team";
      date: Date;
      id: string;
      image: string;
      createdAt: Date;
      updatedAt: Date;
      priority: number;
      title: string;
      description: string;
      venue: string;
      deadline: Date;
      status: "Draft" | "Published" | "Ongoing" | "Completed";
      audience: "Participants" | "Non-Participants" | "Both";
      category: string;
      hfAmount: number;
      collegeAmount: number;
      nonCollegeAmount: number;
      maxTeams: number;
      minTeamSize: number;
      maxTeamSize: number;
    }[];
    if (assigned) {
      // assert session and dashboardUser.id exist
      if (!session?.dashboardUser.id) {
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
          }),
        );
      }

      events = await db.transaction(async (tx) => {
        const organizers = await tx.query.eventOrganizers.findMany({
          where: (o, { eq }) => eq(o.organizerId, session.dashboardUser.id),
        });

        return await tx.query.events.findMany({
          where: (e, { inArray }) =>
            inArray(
              e.id,
              organizers.map((o) => o.eventId),
            ),
          orderBy: (events, { asc }) => asc(events.priority),
        });
      });
    } else {
      events = await query.events.findMany({
        orderBy: (events, { asc }) => asc(events.priority),
      });
    }

    return successResponse(events, { toast: false });
  } catch (error) {
    console.error("getAllEventsForAdmin Error:", error);
    return errorResponse(
      new AppError("Failed to fetch events for admin.", 500, {
        toast: true,
        title: "Failed to fetch events",
      }),
    );
  }
}

export async function getEventById(id: string | null): Promise<NextResponse> {
  try {
    if (!id) {
      return errorResponse(
        new AppError("Missing required field", 400, {
          toast: true,
          title: "Fetch Failed",
          description: "Event ID is required.",
        }),
      );
    }

    const event = await query.events.findOne({
      where: eq(events.id, id),
    });

    if (!event) {
      return errorResponse(
        new AppError("Event not found", 404, {
          toast: true,
          title: "Fetch Failed",
          description: "The specified event does not exist.",
        }),
      );
    }

    return successResponse(event, { toast: false });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to fetch event.", 500, {
        toast: true,
        title: "Failed to fetch event",
      }),
    );
  }
}

export async function getEventTeams(
  eventId: string | null,
): Promise<NextResponse> {
  try {
    if (!eventId) {
      return errorResponse(
        new AppError("Missing required field", 400, {
          toast: true,
          title: "Fetch Failed",
          description: "Event ID is required.",
        }),
      );
    }

    const result = await db
      .select()
      .from(eventTeams)
      .where(eq(eventTeams.eventId, eventId))
      .orderBy(eventTeams.attended, eventTeams.name);

    return successResponse(result, { toast: false });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to fetch event teams.", 500, {
        toast: true,
        title: "Failed to fetch event teams",
        description: "An unknown error occurred while fetching event teams.",
      }),
    );
  }
}

export async function getTeamDetails(
  teamId: string | null,
): Promise<NextResponse> {
  try {
    if (!teamId) {
      return errorResponse(
        new AppError("Missing required field", 400, {
          toast: true,
          title: "Missing required field",
          description: "Team ID is required to fetch team details",
        }),
      );
    }

    const team = await db.query.eventTeams.findFirst({
      where: eq(eventTeams.id, teamId),
      with: {
        members: {
          orderBy: (members, { desc }) => desc(members.isLeader),
          with: {
            user: {
              with: {
                college: true,
              },
            },
          },
        },
        payments: {
          orderBy: (payments, { desc }) => desc(payments.createdAt),
        },
      },
    });

    if (!team) {
      return errorResponse(
        new AppError("Team not found", 404, {
          toast: true,
          title: "Team not found",
          description: "The specified team does not exist.",
        }),
      );
    }

    const data = {
      id: team.id,
      name: team.name,
      paymentStatus: team.paymentStatus,
      attended: team.attended,
      isComplete: team.isComplete,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      college: team.members[0]?.user.college?.name || "N/A",
      state: team.members[0]?.user.college?.state || "N/A",
      members: team.members.map((member) => {
        return {
          userId: member.user.id,
          participantId: member.id,
          name: member.user.name,
          email: member.user.email,
          isLeader: member.isLeader,
          college: member.user.college?.name || "N/A",
          state: member.user.state || "N/A",
          gender: member.user.gender || "N/A",
          attended: member.attended,
        };
      }),
    } as TeamDetails;

    return successResponse(data, {
      toast: false,
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to fetch team details.", 500, {
        toast: true,
        title: "Failed to fetch team details",
        description: "An unknown error occurred while fetching team details.",
      }),
    );
  }
}

export async function deleteEventById(
  eventId: string | null,
): Promise<NextResponse> {
  try {
    if (!eventId) {
      return errorResponse(
        new AppError("Missing required field", 400, {
          toast: true,
          title: "Delete Failed",
          description: "Event ID is required.",
        }),
      );
    }

    const result = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning();

    if (result.length === 0) {
      return errorResponse(
        new AppError("Event not found", 404, {
          toast: true,
          title: "Delete Failed",
          description: "The specified event does not exist.",
        }),
      );
    }
    return successResponse(result[0], {
      toast: true,
      title: "Event Deleted",
      description: "The event has been deleted successfully.",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to delete event.", 500, {
        toast: true,
        title: "Failed to delete event",
      }),
    );
  }
}

// biome-ignore lint/suspicious/noExplicitAny: data is checked by zod
export async function createNewEvent(data: any): Promise<NextResponse> {
  try {
    const parsedData = eventSchema.safeParse({
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
      deadline: data.deadline ? new Date(data.deadline) : new Date(),
    });

    if (!parsedData.success) {
      return errorResponse(
        new AppError("Validation failed", 400, {
          toast: true,
          title: "Creation Failed",
          description: parsedData.error.issues
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join("; "),
        }),
      );
    }

    const priorityMax = await db
      .select()
      .from(events)
      .orderBy(desc(events.priority))
      .limit(1);

    const newEvent = await db
      .insert(events)
      .values({
        ...parsedData.data,
        priority: (priorityMax[0]?.priority ?? 0) + 1,
      })
      .returning();

    if (newEvent.length === 0) {
      return errorResponse(
        new AppError("Failed to create event", 500, {
          toast: true,
          title: "Creation Failed",
          description: "An unknown error occurred while creating the event.",
        }),
      );
    }

    return successResponse(newEvent[0], {
      toast: true,
      title: "Event Created",
      description: "The event has been created successfully.",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to create event.", 500, {
        toast: true,
        title: "Failed to create event",
      }),
    );
  }
}

export async function updateEventStatus(
  eventId: string | null,
  newStatus: string | null,
): Promise<NextResponse> {
  try {
    if (!eventId || !newStatus) {
      return errorResponse(
        new AppError("Missing required fields", 400, {
          toast: true,
          title: "Update Failed",
          description: "Event ID and new status are required.",
        }),
      );
    }

    const result = await db
      .update(events)
      .set({ status: newStatus as (typeof eventStatusEnum.enumValues)[number] })
      .where(eq(events.id, eventId))
      .returning();

    if (result.length === 0) {
      return errorResponse(
        new AppError("Event not found", 404, {
          toast: true,
          title: "Update Failed",
          description: "The specified event does not exist.",
        }),
      );
    }

    return successResponse(result[0], {
      toast: true,
      title: "Event Status Updated",
      description: "The event status has been updated successfully.",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to update event status.", 500, {
        toast: true,
        title: "Failed to update event status",
      }),
    );
  }
}

export async function updateEventById(
  id: string | null,
  // biome-ignore lint/suspicious/noExplicitAny: data check done by zod
  data: any,
): Promise<NextResponse> {
  try {
    if (!id) {
      return errorResponse(
        new AppError("Missing required field", 400, {
          toast: true,
          title: "Update Failed",
          description: "Event ID is required.",
        }),
      );
    }

    const parsedData = eventSchema.safeParse({
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
      deadline: data.deadline ? new Date(data.deadline) : new Date(),
    });
    if (!parsedData.success) {
      return errorResponse(
        new AppError("Validation failed", 400, {
          toast: true,
          title: "Update Failed",
          description: parsedData.error.issues
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join("; "),
        }),
      );
    }

    const existingEvent = await query.events.findOne({
      where: eq(events.id, id),
    });
    if (!existingEvent) {
      return errorResponse(
        new AppError("Event not found or cannot be updated", 404, {
          toast: true,
          title: "Update Failed",
          description: "The specified event does not exist",
        }),
      );
    }

    const result = await query.events.update(id, parsedData.data);
    if (result.length === 0) {
      return errorResponse(
        new AppError("Failed to update event", 500, {
          toast: true,
          title: "Update Failed",
          description: "An unknown error occurred while updating the event.",
        }),
      );
    }

    return successResponse(result[0], {
      toast: true,
      title: "Event Updated",
      description: "The event has been updated successfully.",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to update event.", 500, {
        toast: true,
        title: "Failed to update event",
        description: "An unknown error occurred while updating the event.",
      }),
    );
  }
}

export async function toggleAttendanceById(
  teamId: string | null,
  attended: boolean | null,
): Promise<NextResponse> {
  try {
    if (!teamId || attended === null || attended === undefined) {
      return errorResponse(
        new AppError("Missing required fields", 400, {
          toast: true,
          title: "Missing fields",
          description: "Team ID and attendance status are required.",
        }),
      );
    }

    const result = await query.eventTeams.update(teamId, {
      attended: attended,
    });
    await db
      .update(eventParticipants)
      .set({ attended: attended })
      .where(eq(eventParticipants.teamId, teamId))
      .returning();

    if (result.length === 0) {
      return errorResponse(
        new AppError("Team not found", 404, {
          toast: true,
          title: "Update Failed",
          description: "The specified team does not exist.",
        }),
      );
    }

    return successResponse(true, {
      toast: true,
      title: "Attendance Updated",
      // description: "The attendance status has been updated successfully.",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to update attendance.", 500, {
        toast: true,
        title: "Failed to update attendance",
        description: "An unknown error occurred while updating attendance.",
      }),
    );
  }
}

export async function toggleParticipantAttendanceById(
  participantId: string | null,
  attended: boolean | null,
): Promise<NextResponse> {
  try {
    if (!participantId || attended === null || attended === undefined) {
      return errorResponse(
        new AppError("Missing required fields", 400, {
          toast: true,
          title: "Missing fields",
          description: "Participant ID and attendance status are required.",
        }),
      );
    }

    const result = await query.eventParticipants.update(participantId, {
      attended: attended,
    });

    if (result.length === 0) {
      return errorResponse(
        new AppError("Participant not found", 404, {
          toast: true,
          title: "Update Failed",
          description: "The specified participant does not exist.",
        }),
      );
    }

    return successResponse(true, {
      toast: true,
      title: "Attendance Updated",
      // description: "The attendance status has been updated successfully.",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to update attendance.", 500, {
        toast: true,
        title: "Failed to update attendance",
        description: "An unknown error occurred while updating attendance.",
      }),
    );
  }
}

export async function reorderEventPriorities(
  orderedIds: string[],
): Promise<NextResponse> {
  try {
    if (!orderedIds || orderedIds.length === 0) {
      return errorResponse(
        new AppError("Missing required field", 400, {
          toast: true,
          title: "Reorder Failed",
          description: "Ordered event IDs are required.",
        }),
      );
    }

    await db.transaction(async (tx) => {
      const updates = orderedIds.map((id, index) =>
        tx
          .update(events)
          .set({ priority: index + 1 })
          .where(eq(events.id, id)),
      );
      await Promise.all(updates);
    });

    return successResponse(true, {
      toast: true,
      title: "Events Reordered",
      description: "Event priority order has been updated.",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to reorder events.", 500, {
        toast: true,
        title: "Failed to reorder events",
      }),
    );
  }
}
