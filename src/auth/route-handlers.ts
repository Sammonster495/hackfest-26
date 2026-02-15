import type { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { getCurrentEventUser, getCurrentUser } from "./get-current-user";

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: Session["user"],
) => Promise<NextResponse>;

export function protectedRoute(handler: RouteHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
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

export function protectedEventRoute(handler: RouteHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    const user = await getCurrentEventUser();

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

export function registrationRequiredRoute(handler: RouteHandler) {
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
  });
}
