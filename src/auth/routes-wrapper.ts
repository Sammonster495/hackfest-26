import { NextApiHandler, NextApiRequest } from "next";
import { getCurrentUser } from "./get-current-user";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { Session } from "next-auth";

export function protectedRoute(
  handler: (req: NextApiRequest, user: Session["user"]) => Promise<any>,
): NextApiHandler {
  return async (req: NextApiRequest) => {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(
        new AppError("UNAUTHORIZED", 401, {
          title: "Login required",
          description: "Please sign in to continue.",
        }),
      );
    }

    try {
      return await handler(req, user);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function roleRoute(
  requiredRoles: string | string[],
  handler: (req: NextApiRequest, user: Session["user"]) => Promise<any>,
) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return protectedRoute(async (req, user) => {
    if (!roles.includes(user.role)) {
      return errorResponse(
        new AppError("FORBIDDEN", 403, {
          title: "Access denied",
          description: "You don't have permission to access this.",
        }),
      );
    }

    try {
      return await handler(req, user);
    } catch (err) {
      return errorResponse(err);
    }
  });
}
