import { auth as dashboardAuth } from "~/auth/dashboard-config";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
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

type ActionParams = { action: string };

export const GET = permissionProtected<ActionParams>(
  ["event:manage"],
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

    switch (action) {
      case "getAll": {
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:read_all")
        ) {
          return await getAllEventsForAdmin({});
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:read")
        ) {
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:read")
        ) {
          return await getEventById(searchParams.get("id") ?? null);
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:read")
        ) {
          return await getEventTeams(searchParams.get("id") ?? null);
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:read")
        ) {
          const teamId = searchParams.get("id") ?? null;
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

    switch (action) {
      case "updateStatus": {
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:update")
        ) {
          const { eventId, newStatus } = await req.json();
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:update")
        ) {
          const { id, data } = await req.json();
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:attendance")
        ) {
          const { teamId, attended } = await req.json();
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:attendance")
        ) {
          const { participantId, attended } = await req.json();
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
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:update")
        ) {
          const { orderedIds } = await req.json();
          return await reorderEventPriorities(orderedIds);
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

    switch (action) {
      case "delete": {
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:delete")
        ) {
          const { eventId } = await req.json();
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

    switch (action) {
      case "create": {
        if (
          isAdmin(session.dashboardUser) ||
          hasPermission(session.dashboardUser, "event:create")
        ) {
          const data = await req.json();
          return await createNewEvent(data);
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
