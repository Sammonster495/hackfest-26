import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "~/auth/dashboard-config";
import { hasPermission, isAdmin } from "~/lib/auth/check-access";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { getCurrentUser } from "./get-current-user";

export type RouteContext<T = Record<string, string>> = {
  params: Promise<T>;
};

export type DashboardUser = Session["dashboardUser"];

type RouteHandler<T = Record<string, string>> = (
  request: Request,
  context: RouteContext<T>,
  user: NonNullable<DashboardUser>,
) => Promise<Response>;

export function protectedRoute(
  handler: (
    req: NextApiRequest,
    user: Session["user"],
  ) => Promise<NextApiResponse>,
): NextApiHandler {
  return async (req: NextApiRequest) => {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(
        new AppError("UNAUTHORIZED", 401, {
          title: "Login required",
          description: "Please sign in to continue.",
        }),
      ) as unknown as NextApiResponse;
    }

    try {
      return await handler(req, user);
    } catch (err) {
      return errorResponse(err) as unknown as NextApiResponse;
    }
  };
}

export function adminProtected<T = Record<string, string>>(
  handler: RouteHandler<T>,
) {
  return async (request: Request, context: RouteContext<T>) => {
    const session = await auth();

    if (!session?.dashboardUser) {
      return NextResponse.json(
        { error: "Unauthorized: Not logged in" },
        { status: 401 },
      );
    }

    if (!isAdmin(session.dashboardUser)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    try {
      return await handler(request, context, session.dashboardUser);
    } catch (err) {
      return errorResponse(err) as unknown as Response;
    }
  };
}

export function permissionProtected<T = Record<string, string>>(
  permissions: string[],
  handler: RouteHandler<T>,
) {
  return async (request: Request, context: RouteContext<T>) => {
    const session = await auth();

    if (!session?.dashboardUser) {
      return NextResponse.json(
        { error: "Unauthorized: Not logged in" },
        { status: 401 },
      );
    }

    // Admins bypass permission checks
    if (isAdmin(session.dashboardUser)) {
      try {
        return await handler(request, context, session.dashboardUser);
      } catch (err) {
        return errorResponse(err) as unknown as Response;
      }
    }

    // Check if user has at least one of the required permissions
    const hasAnyPermission = permissions.some((perm) =>
      hasPermission(session.dashboardUser, perm),
    );

    if (!hasAnyPermission) {
      return NextResponse.json(
        {
          error: "Unauthorized: Insufficient permissions",
          required: permissions,
        },
        { status: 403 },
      );
    }

    try {
      return await handler(request, context, session.dashboardUser);
    } catch (err) {
      return errorResponse(err) as unknown as Response;
    }
  };
}
