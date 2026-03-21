import type { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { RateLimiterRedis } from "rate-limiter-flexible";
import { eventRegistrationOpen, findByEventId } from "~/db/data/event";
import { AppError } from "~/lib/errors/app-error";
import { getIdentifier, rateLimiters, withRateLimit } from "~/lib/rate-limit";
import { errorResponse } from "~/lib/response/error";
import { getCurrentEventUser, getCurrentUser } from "./get-current-user";

type User = NonNullable<Session["user"]>;
type EventUser = NonNullable<Session["user"]>;

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: User,
) => Promise<NextResponse>;

type EventRouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: EventUser,
) => Promise<NextResponse>;

type GlobalRouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: User | EventUser,
) => Promise<NextResponse>;

type PublicRouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function protectedRoute(
  handler: RouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    const limiter = customRateLimiter || rateLimiters.api;
    const identifier = getIdentifier(request);
    const rateLimitResponse = await withRateLimit(request, limiter, identifier);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(
        new AppError("UNAUTHORIZED", 401, {
          title: "Unauthorized",
          description: "You must be logged in to perform this action.",
        }),
      );
    }

    try {
      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function registrationRequiredRoute(
  handler: RouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return protectedRoute(async (request, context, user) => {
    if (!user.isRegistrationComplete) {
      return errorResponse(
        new AppError("REGISTRATION_INCOMPLETE", 403, {
          title: "Registration incomplete",
          description:
            "Please complete your registration before accessing this resource.",
        }),
      );
    }

    try {
      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  }, customRateLimiter);
}

export function protectedEventRoute(
  handler: EventRouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const limiter = customRateLimiter || rateLimiters.api;
      const identifier = getIdentifier(request);
      const rateLimitResponse = await withRateLimit(
        request,
        limiter,
        identifier,
      );
      if (rateLimitResponse) return rateLimitResponse;

      const user = await getCurrentEventUser();

      if (!user) {
        return errorResponse(
          new AppError("UNAUTHORIZED", 401, {
            title: "Unauthorized",
            description: "You must be logged in to perform this action.",
          }),
        );
      }

      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function registrationOpenEventRoute(handler: EventRouteHandler) {
  return protectedEventRoute(async (request, context, user) => {
    try {
      const registrationsOpen = await eventRegistrationOpen();

      if (!registrationsOpen) {
        return errorResponse(
          new AppError("REGISTRATION_CLOSED", 403, {
            title: "Registration closed",
            description: "Event registration is currently closed.",
          }),
        );
      }

      if (!user.collegeId) {
        return errorResponse(
          new AppError("COLLEGE_NOT_SET", 400, {
            title: "College not set",
            description:
              "You cannot register for events until you set your college in your user profile.",
          }),
        );
      }

      const { id: eventId } = await context.params;
      const event = await findByEventId(eventId);

      if (!event || event.status === "Draft") {
        return errorResponse(
          new AppError("EVENT_NOT_FOUND", 404, {
            title: "Event not found",
            description: "The specified event does not exist.",
          }),
        );
      }

      if (new Date(event.deadline) < new Date()) {
        return errorResponse(
          new AppError("REGISTRATION_CLOSED", 403, {
            title: "Registration closed",
            description: "Registrations for this event have closed.",
          }),
        );
      }

      if (event.status === "Ongoing" || event.status === "Completed") {
        return errorResponse(
          new AppError("EVENT_NOT_OPEN_FOR_REGISTRATION", 403, {
            title: "Event not open for registration",
            description: `Registrations for this event are closed as it is ${event.status === "Ongoing" ? "currently" : ""} ${event.status.toLowerCase()}.`,
          }),
        );
      }

      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  });
}

export function protectedGlobalRoute(
  handler: GlobalRouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const limiter = customRateLimiter || rateLimiters.api;
      const identifier = getIdentifier(request);
      const rateLimitResponse = await withRateLimit(
        request,
        limiter,
        identifier,
      );
      if (rateLimitResponse) return rateLimitResponse;

      const user = (await getCurrentUser()) ?? (await getCurrentEventUser());

      if (!user) {
        return errorResponse(
          new AppError("UNAUTHORIZED", 401, {
            title: "Unauthorized",
            description: "You must be logged in to perform this action.",
          }),
        );
      }

      return await handler(request, context, user);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function publicRoute(
  handler: PublicRouteHandler,
  customRateLimiter?: RateLimiterRedis,
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      // try ip based cuz no user on public routes
      const limiter = customRateLimiter || rateLimiters.api;
      const identifier = getIdentifier(request);
      const rateLimitResponse = await withRateLimit(
        request,
        limiter,
        identifier,
      );
      if (rateLimitResponse) return rateLimitResponse;

      return await handler(request, context);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
