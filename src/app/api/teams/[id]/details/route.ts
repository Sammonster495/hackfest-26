import { registrationRequiredRoute } from "~/auth/route-handlers";
import * as userData from "~/db/data/participant";
import { getSiteSettings } from "~/db/data/siteSettings";
import * as teamData from "~/db/data/teams";
import { getFormStatus } from "~/db/services/team-services";
import { AppError } from "~/lib/errors/app-error";
import { successResponse } from "~/lib/response/success";

// not using it as of now [RAHUL]
export const GET = registrationRequiredRoute(async (_req, ctx, user) => {
  const params = await ctx.params;
  const { id } = params;
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
  try {
    const teamsStatus = await getFormStatus(team.id);
    const siteSettingsData = await getSiteSettings();
    return successResponse({ team, teamsStatus, siteSettingsData });
  } catch (error) {
    console.error("Error fetching team details:", error);
    throw new AppError("INTERNAL_ERROR", 500, {
      title: "Internal server error",
      description: "Failed to fetch team details. Please try again later.",
    });
  }
});
