import type { NextRequest } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as userData from "~/db/data/participant";
import * as teamData from "~/db/data/teams";
import { createParticipationPayment } from "~/db/services/payment-services";
import { AppError } from "~/lib/errors/app-error";
import { successResponse } from "~/lib/response/success";

export const POST = registrationRequiredRoute(
  async (req: NextRequest, ctx, user) => {
    const params = await ctx.params;
    const { id: teamId } = params as { id: string };

    const body = (await req.json()) as {
      paymentScreenshotUrl?: string;
      paymentTransactionId?: string;
    };

    const { paymentScreenshotUrl, paymentTransactionId } = body;

    if (!paymentScreenshotUrl || !paymentTransactionId) {
      throw new AppError("MISSING_FIELDS", 400, {
        title: "Missing fields",
        description: "Payment screenshot URL and transaction ID are required.",
      });
    }

    const team = await teamData.findById(teamId);
    if (!team) {
      throw new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
      });
    }

    const dbUser = await userData.findById(user.id);
    if (!dbUser || dbUser.teamId !== teamId) {
      throw new AppError("FORBIDDEN", 403, {
        title: "Access denied",
        description: "You can only make payments for your own team.",
      });
    }

    const members = await teamData.listMembers(teamId);

    const inserted = await createParticipationPayment({
      userId: user.id,
      teamId,
      paymentScreenshotUrl,
      paymentTransactionId,
      memberCount: members.length,
    });

    return successResponse(
      { paymentId: inserted?.id },
      {
        title: "Payment submitted",
        description:
          "Your payment screenshot has been submitted. We will verify it shortly.",
      },
    );
  },
);
