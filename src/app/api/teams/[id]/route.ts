import type { NextRequest } from "next/server";
import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as userData from "~/db/data/participant";
import { getSiteSettings } from "~/db/data/siteSettings";
import * as teamData from "~/db/data/teams";
import { getIdeaSubmission } from "~/db/services/idea-services";
import { findCollegeByUserId } from "~/db/services/participant-services";
import {
  checkPayment,
  hasPendingPayment,
} from "~/db/services/payment-services";
import { getFormStatus } from "~/db/services/team-services";
import { AppError } from "~/lib/errors/app-error";
import { successResponse } from "~/lib/response/success";

export const GET = registrationRequiredRoute(
  async (_req: NextRequest, ctx, user) => {
    const params = await ctx.params;
    const { id } = params as { id: string };
    const team = await teamData.findById(id);

    if (!team) {
      throw new AppError("TEAM_NOT_FOUND", 404, {
        title: "Team not found",
        description: "The team you're looking for doesn't exist.",
      });
    }

    const dbUser = await userData.findById(user.id);
    if (!dbUser || dbUser.teamId !== team.id) {
      throw new AppError("FORBIDDEN", 403, {
        title: "Access denied",
        description: "You can only view teams you are a member of.",
      });
    }

    const [
      members,
      siteSettingsData,
      teamStatus,
      submission,
      collegeName,
      isPaymentPending,
      paymentSubmitted,
    ] = await Promise.all([
      teamData.listMembers(id),
      getSiteSettings(),
      getFormStatus(id),
      getIdeaSubmission(id),
      findCollegeByUserId(user.id),
      hasPendingPayment(id),
      checkPayment(id),
    ]);

    return successResponse({
      team,
      members,
      siteSettings: siteSettingsData,
      teamStatus,
      submission,
      user: {
        id: dbUser.id,
        name: dbUser.name ?? "",
        email: dbUser.email ?? "",
        teamId: dbUser.teamId,
      },
      collegeName,
      hasPendingPayment: isPaymentPending,
      paymentSubmitted,
    });
  },
);
