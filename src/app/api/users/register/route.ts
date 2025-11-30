import { NextRequest } from "next/server";
import * as userData from "~/db/data/users";
import { parseBody } from "~/lib/validation/parse";
import { registerUserSchema } from "~/lib/validation/user";
import { AppError } from "~/lib/errors/app-error";
import { successResponse } from "~/lib/response/success";
import { protectedRoute } from "~/auth/route-handlers";

export const POST = protectedRoute(
  async (request: NextRequest, _context, user) => {
    const body = await request.json();
    const data = parseBody(registerUserSchema, body);

    const existing = await userData.findByEmail(user.email!);
    if (!existing) {
      throw new AppError("USER_NOT_FOUND", 404, {
        title: "User not found",
        description: "User account not found. Please try signing in again.",
      });
    }

    if (existing.isRegistrationComplete) {
      throw new AppError("USER_ALREADY_REGISTERED", 400, {
        title: "Already registered",
        description: "You have already completed your registration.",
      });
    }

    const updatedUser = await userData.updateUser(existing.id, {
      ...data,
      isRegistrationComplete: true,
    });

    return successResponse(
      { user: updatedUser },
      {
        title: "Registration successful",
        description:
          "Your account has been updated. You can now create or join a team.",
      },
    );
  },
);
