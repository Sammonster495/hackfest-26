import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { getCurrentUser } from "./get-current-user";

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

export function roleRoute(
  requiredRoles: string | string[],
  handler: (
    req: NextApiRequest,
    user: Session["user"],
  ) => Promise<NextApiResponse>,
) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return protectedRoute(async (req, user) => {
    if (!roles.includes(user.role)) {
      return errorResponse(
        new AppError("FORBIDDEN", 403, {
          title: "Access denied",
          description: "You don't have permission to access this.",
        }),
      ) as unknown as NextApiResponse;
    }

    try {
      return await handler(req, user);
    } catch (err) {
      return errorResponse(err) as unknown as NextApiResponse;
    }
  });
}
