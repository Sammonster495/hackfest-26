import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./get-current-user";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { Session } from "next-auth";

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: Session["user"],
) => Promise<NextResponse>;

type RouteHandlerWithParams<
  T extends Record<string, string> = Record<string, string>,
> = (
  request: NextRequest,
  context: { params: Promise<T> },
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

export function roleRoute(
  requiredRoles: string | string[],
  handler: RouteHandler,
) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return protectedRoute(async (request, context, user) => {
    if (!roles.includes(user.role)) {
      return errorResponse(
        new AppError("FORBIDDEN", 403, {
          title: "Access denied",
          description: "You don't have permission to access this resource.",
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
