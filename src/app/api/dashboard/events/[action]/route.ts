import { z } from "zod";
import { auth as dashboardAuth } from "~/auth/dashboard-config";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import {
  canAccessEvent,
  canAccessParticipant,
  canAccessTeam,
  getEventAssignableOrganizers,
} from "~/db/services/event-access-services";
import {
  addOrganizerTeamMember,
  createOrganizerEventTeam,
  deleteOrganizerEventTeam,
  getOrganizerAvailableParticipants,
  getOrganizerEventsStats,
  getOrganizerEventTeams,
  getOrganizerTeamMembers,
  setOrganizerTeamLeader,
  updateOrganizerEventTeam,
} from "~/db/services/event-stats-services";
import {
  createNewEvent,
  deleteEventById,
  getAllEventsForAdmin,
  getEventById,
  getEventTeams,
  getTeamDetails,
  reorderEventPriorities,
  toggleAttendanceById,
  toggleParticipantAttendanceById,
  updateEventById,
  updateEventStatus,
} from "~/db/services/manage-event";
import { hasPermission, isAdmin } from "~/lib/auth/permissions";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";

type ActionParams = { action: string };

const createOrganizerEventTeamSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  name: z.string().trim().min(1, "Team name is required").max(100),
});

const updateOrganizerEventTeamSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  name: z.string().trim().min(1).max(100).optional(),
  attended: z.boolean().optional(),
  isComplete: z.boolean().optional(),
});

const deleteOrganizerEventTeamSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
});

const addOrganizerTeamMemberSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  participantId: z.string().min(1, "Participant is required"),
});

const setOrganizerTeamLeaderSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  participantId: z.string().min(1, "Participant is required"),
});

export const GET = permissionProtected<ActionParams>(
  ["event:manage", "event:organizer"],
  async (req: Request, context: RouteContext<ActionParams>) => {
    const url = new URL(req.url);
    const { action } = await context.params;
    const session = await dashboardAuth();
    const searchParams = new URLSearchParams(url.searchParams);

    if (!session || !session.dashboardUser) {
      return errorResponse(
        new AppError("Unauthorized", 401, {
          toast: true,
          title: "Unauthorized",
          description: "You are not authorized to view this resource",
        }),
      );
    }

    const adminUser = isAdmin(session.dashboardUser);
    const canManageEvents = hasPermission(
      session.dashboardUser,
      "event:manage",
    );
    const canManageOrganizer =
      hasPermission(session.dashboardUser, "event:organizer") ||
      session.dashboardUser.roles.some((role) => role.name === "ORGANIZER");

    switch (action) {
      case "getAll": {
        if (adminUser) {
          return await getAllEventsForAdmin({});
        }
        // commented by ashton security reasons
        if (canManageEvents) {
          return getAllEventsForAdmin({ assigned: true, session });
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getAllAssigned": {
        if (isAdmin(session.dashboardUser) || canManageEvents) {
          return getAllEventsForAdmin({ assigned: true, session: session });
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getById": {
        if (adminUser || canManageEvents) {
          const eventId = searchParams.get("id") ?? null;
          if (!eventId) {
            return errorResponse(
              new AppError("Missing required field", 400, {
                title: "Missing event ID",
                description: "Event ID is required.",
              }),
            );
          }
          // commented by ashton security reasons
          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return await getEventById(eventId);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getEventTeams": {
        if (adminUser || canManageEvents) {
          const eventId = searchParams.get("id") ?? null;
          if (!eventId) {
            return errorResponse(
              new AppError("Missing required field", 400, {
                title: "Missing event ID",
                description: "Event ID is required.",
              }),
            );
          }
          // commented by ashton security reasons
          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return await getEventTeams(eventId);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getTeamDetails": {
        if (adminUser || canManageEvents) {
          const teamId = searchParams.get("id") ?? null;
          if (!teamId) {
            return errorResponse(
              new AppError("Missing required field", 400, {
                title: "Missing team ID",
                description: "Team ID is required.",
              }),
            );
          }
          // commented by ashton security reasons
          if (
            !(await canAccessTeam(session.dashboardUser.id, teamId, adminUser))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return await getTeamDetails(teamId);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getOrganizerEventStats": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          return getOrganizerEventsStats(session.dashboardUser.id, adminUser);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getOrganizerEventTeams": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          return getOrganizerEventTeams(
            session.dashboardUser.id,
            searchParams.get("id"),
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getOrganizerAvailableParticipants": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const eventId = searchParams.get("id") ?? "";
          const query = searchParams.get("q") ?? "";

          if (!eventId) {
            return errorResponse(
              new AppError("Missing required field", 400, {
                title: "Missing event ID",
                description: "Event ID is required.",
              }),
            );
          }

          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }

          return getOrganizerAvailableParticipants(
            session.dashboardUser.id,
            eventId,
            query,
            20,
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getOrganizerTeamMembers": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const eventId = searchParams.get("eventId") ?? "";
          const teamId = searchParams.get("teamId") ?? "";
          const query = searchParams.get("q") ?? "";

          if (!eventId || !teamId) {
            return errorResponse(
              new AppError("Missing required field", 400, {
                title: "Missing fields",
                description: "Event ID and Team ID are required.",
              }),
            );
          }

          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }

          return getOrganizerTeamMembers(
            session.dashboardUser.id,
            eventId,
            teamId,
            query,
            20,
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      case "getAssignableOrganizers": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const assignableUsers = await getEventAssignableOrganizers();
          return successResponse(assignableUsers, { toast: false });
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to view this resource",
          }),
        );
      }

      default:
        return errorResponse(
          new AppError("Unknown action", 404, {
            toast: false,
          }),
        );
    }
  },
);

export const POST = permissionProtected<ActionParams>(
  ["event:manage", "event:organizer"],
  async (req: Request, context: RouteContext<ActionParams>) => {
    const { action } = await context.params;
    const session = await dashboardAuth();

    if (!session || !session.dashboardUser) {
      return errorResponse(
        new AppError("Unauthorized", 401, {
          toast: true,
          title: "Unauthorized",
          description: "You are not authorized to perform this action",
        }),
      );
    }

    const adminUser = isAdmin(session.dashboardUser);
    const canManageEvents = hasPermission(
      session.dashboardUser,
      "event:manage",
    );
    const canManageOrganizer =
      hasPermission(session.dashboardUser, "event:organizer") ||
      session.dashboardUser.roles.some((role) => role.name === "ORGANIZER");

    switch (action) {
      case "updateStatus": {
        if (adminUser || canManageEvents) {
          const { eventId, newStatus } = await req.json();
          // commented by ashton security reasons
          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return await updateEventStatus(eventId, newStatus);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "update": {
        if (adminUser || canManageEvents) {
          const { id, data } = await req.json();
          // commented by ashton security reasons
          if (
            !(await canAccessEvent(session.dashboardUser.id, id, adminUser))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return await updateEventById(id, data);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "updateAttendance": {
        if (adminUser || canManageEvents) {
          const { teamId, attended } = await req.json();
          // commented by ashton security reasons
          if (
            !(await canAccessTeam(session.dashboardUser.id, teamId, adminUser))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return toggleAttendanceById(teamId, attended);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "updateParticipantAttendance": {
        if (adminUser || canManageEvents) {
          const { participantId, attended } = await req.json();
          // commented by ashton security reasons
          if (
            !(await canAccessParticipant(
              session.dashboardUser.id,
              participantId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return toggleParticipantAttendanceById(participantId, attended);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "reorder": {
        if (adminUser) {
          const { orderedIds } = await req.json();
          return await reorderEventPriorities(orderedIds);
        }
        // commented by ashton security reasons
        return errorResponse(
          new AppError("Unauthorized", 403, {
            toast: true,
            title: "Access denied",
            description: "Only admin can reorder all events.",
          }),
        );
      }

      case "createOrganizerEventTeam": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const body = await req.json();
          const parsed = createOrganizerEventTeamSchema.safeParse(body);

          if (!parsed.success) {
            return errorResponse(
              new AppError("Invalid input", 400, {
                title: "Invalid input",
                description: parsed.error.issues
                  .map((issue) => issue.message)
                  .join(", "),
              }),
            );
          }

          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              parsed.data.eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }

          return createOrganizerEventTeam(
            session.dashboardUser.id,
            parsed.data.eventId,
            parsed.data.name,
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "updateOrganizerEventTeam": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const body = await req.json();
          const parsed = updateOrganizerEventTeamSchema.safeParse(body);

          if (!parsed.success) {
            return errorResponse(
              new AppError("Invalid input", 400, {
                title: "Invalid input",
                description: parsed.error.issues
                  .map((issue) => issue.message)
                  .join(", "),
              }),
            );
          }

          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              parsed.data.eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }

          const { eventId, teamId, ...updates } = parsed.data;

          if (
            updates.name === undefined &&
            updates.attended === undefined &&
            updates.isComplete === undefined
          ) {
            return errorResponse(
              new AppError("NOTHING_TO_UPDATE", 400, {
                title: "Nothing to update",
                description: "No update fields were provided.",
              }),
            );
          }

          return updateOrganizerEventTeam(
            session.dashboardUser.id,
            eventId,
            teamId,
            updates,
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "addOrganizerTeamMember": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const body = await req.json();
          const parsed = addOrganizerTeamMemberSchema.safeParse(body);

          if (!parsed.success) {
            return errorResponse(
              new AppError("Invalid input", 400, {
                title: "Invalid input",
                description: parsed.error.issues
                  .map((issue) => issue.message)
                  .join(", "),
              }),
            );
          }

          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              parsed.data.eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }

          return addOrganizerTeamMember(
            session.dashboardUser.id,
            parsed.data.eventId,
            parsed.data.teamId,
            parsed.data.participantId,
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "setOrganizerTeamLeader": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const body = await req.json();
          const parsed = setOrganizerTeamLeaderSchema.safeParse(body);

          if (!parsed.success) {
            return errorResponse(
              new AppError("Invalid input", 400, {
                title: "Invalid input",
                description: parsed.error.issues
                  .map((issue) => issue.message)
                  .join(", "),
              }),
            );
          }

          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              parsed.data.eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }

          return setOrganizerTeamLeader(
            session.dashboardUser.id,
            parsed.data.eventId,
            parsed.data.teamId,
            parsed.data.participantId,
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      default:
        return errorResponse(
          new AppError("Unknown action", 404, {
            toast: false,
          }),
        );
    }
  },
);

export const DELETE = permissionProtected<ActionParams>(
  ["event:manage", "event:organizer"],
  async (req: Request, context: RouteContext<ActionParams>) => {
    const { action } = await context.params;
    const session = await dashboardAuth();

    if (!session || !session.dashboardUser) {
      return errorResponse(
        new AppError("Unauthorized", 401, {
          toast: true,
          title: "Unauthorized",
          description: "You are not authorized to perform this action",
        }),
      );
    }

    const adminUser = isAdmin(session.dashboardUser);
    const canManageEvents = hasPermission(
      session.dashboardUser,
      "event:manage",
    );
    const canManageOrganizer =
      hasPermission(session.dashboardUser, "event:organizer") ||
      session.dashboardUser.roles.some((role) => role.name === "ORGANIZER");

    switch (action) {
      case "delete": {
        if (adminUser || canManageEvents) {
          const { eventId } = await req.json();
          // commented by ashton security reasons
          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }
          return await deleteEventById(eventId);
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      case "deleteOrganizerEventTeam": {
        if (
          isAdmin(session.dashboardUser) ||
          canManageEvents ||
          canManageOrganizer
        ) {
          const body = await req.json();
          const parsed = deleteOrganizerEventTeamSchema.safeParse(body);

          if (!parsed.success) {
            return errorResponse(
              new AppError("Invalid input", 400, {
                title: "Invalid input",
                description: parsed.error.issues
                  .map((issue) => issue.message)
                  .join(", "),
              }),
            );
          }

          if (
            !(await canAccessEvent(
              session.dashboardUser.id,
              parsed.data.eventId,
              adminUser,
            ))
          ) {
            return errorResponse(
              new AppError("Unauthorized", 403, {
                title: "Access denied",
                description: "You are not an organizer for this event.",
              }),
            );
          }

          return deleteOrganizerEventTeam(
            session.dashboardUser.id,
            parsed.data.eventId,
            parsed.data.teamId,
            adminUser,
          );
        }
        return errorResponse(
          new AppError("Unauthorized", 401, {
            toast: true,
            title: "Unauthorized",
            description: "You are not authorized to perform this action",
          }),
        );
      }

      default:
        return errorResponse(
          new AppError("Unknown action", 404, {
            toast: false,
          }),
        );
    }
  },
);

export const PUT = permissionProtected<ActionParams>(
  ["event:manage"],
  async (req: Request, context: RouteContext<ActionParams>) => {
    const { action } = await context.params;
    const session = await dashboardAuth();

    if (!session || !session.dashboardUser) {
      return errorResponse(
        new AppError("Unauthorized", 401, {
          toast: true,
          title: "Unauthorized",
          description: "You are not authorized to perform this action",
        }),
      );
    }

    const adminUser = isAdmin(session.dashboardUser);

    switch (action) {
      case "create": {
        if (adminUser) {
          const data = await req.json();
          return await createNewEvent(data);
        }
        // commented by ashton security reasons
        return errorResponse(
          new AppError("Unauthorized", 403, {
            toast: true,
            title: "Access denied",
            description:
              "Only admin can create events. Organizers can manage assigned events.",
          }),
        );
      }

      default:
        return errorResponse(
          new AppError("Unknown action", 404, {
            toast: false,
          }),
        );
    }
  },
);
