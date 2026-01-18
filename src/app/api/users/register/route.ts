import type { NextRequest } from "next/server";
import { protectedRoute } from "~/auth/route-handlers";
import * as userData from "~/db/data/participant";
import { AppError } from "~/lib/errors/app-error";
import { successResponse } from "~/lib/response/success";
import { parseBody } from "~/lib/validation/parse";
import { registerParticipantSchema } from "~/lib/validation/participant";

export const POST = protectedRoute(
  async (request: NextRequest, _context, user) => {
    const body = await request.json();
    const data = parseBody(registerParticipantSchema, body);

    if (!user.email) {
      throw new AppError("EMAIL_REQUIRED", 400, {
        title: "Email required",
        description: "Email is required for registration.",
      });
    }
    const existing = await userData.findByEmail(user.email);
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

    // Use existing GitHub username if not provided in form data (auto-fetched from GitHub)
    const updateData = {
      ...data,
      github: data.github || existing.github || undefined,
      isRegistrationComplete: true,
    };

    const updatedUser = await userData.updateUser(existing.id, updateData);

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
