import { adminProtected, workerOnlyRoute } from "~/auth/routes-wrapper";
import {
  getAttendedTeams,
  getTop60Teams,
  notifyAllTop60Participants,
  notifyTop60Leaders,
  toggleGithubCommitStatus,
  toggleGithubRepoPrivacy,
  triggerGithubRepoAutomationForTeams,
} from "~/db/services/worker-services";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import { workerDashboardAPI } from "~/lib/worker/dashboard";
import {
  celeryTask,
  type GithubRepo,
  type GithubTeam,
} from "~/lib/worker/task";

type ActionParams = { action: string };

export const GET = adminProtected<ActionParams>(
  async (_request, _ctx, _user) => {
    const { action } = await _ctx.params;
    const allParams = Object.fromEntries(
      _request.nextUrl.searchParams.entries(),
    );

    switch (action) {
      case "stats":
        return successResponse(await workerDashboardAPI.getDetails(), {
          toast: false,
        });

      case "task-list":
        return successResponse(
          await workerDashboardAPI.getTaskList(allParams),
          { toast: false },
        );

      case "top-60-teams":
        return await getTop60Teams();

      case "attended":
        return await getAttendedTeams();

      default:
        return errorResponse(
          new AppError("Unknown action", 404, {
            toast: false,
          }),
        );
    }
  },
);

export const POST = adminProtected<ActionParams>(
  async (_request, _ctx, _users) => {
    const { action } = await _ctx.params;

    switch (action) {
      case "notify-top-60-leaders":
        return await notifyTop60Leaders();

      case "notify-top-60":
        return await notifyAllTop60Participants();

      case "trigger-automation": {
        const { teamIds }: { teamIds: Array<string> } = await _request.json();
        return await triggerGithubRepoAutomationForTeams(teamIds ?? []);
      }

      case "toggle-commit": {
        const { enabled }: { enabled: boolean } = await _request.json();
        return await toggleGithubCommitStatus(enabled ?? true);
      }

      case "toggle-repo-privacy": {
        const { make_private }: { make_private: boolean } =
          await _request.json();
        return await toggleGithubRepoPrivacy(make_private ?? true);
      }

      case "toggle-sync": {
        const result = await workerDashboardAPI.toggleDataSync();
        return successResponse(result, {
          toast: true,
          title: result.message,
        });
      }

      default:
        return errorResponse(
          new AppError("Unknown action", 404, {
            toast: false,
          }),
        );
    }
  },
);

export const PUT = workerOnlyRoute<ActionParams>(async (_request, _ctx) => {
  const { action } = await _ctx.params;
  const {
    team_id,
    github_team,
    github_repo,
  }: { team_id: string; github_team?: GithubTeam; github_repo?: GithubRepo } =
    await _request.json();

  switch (action) {
    case "team":
      if (team_id === undefined || github_team === undefined) {
        return errorResponse(
          new AppError("Missing parameters", 400, {
            toast: false,
          }),
        );
      }
      return await celeryTask.syncGithubTeam(team_id, github_team);

    case "repo":
      if (team_id === undefined || github_repo === undefined) {
        return errorResponse(
          new AppError("Missing parameters", 400, {
            toast: false,
          }),
        );
      }
      return await celeryTask.syncGithubRepo(team_id, github_repo);

    default:
      return errorResponse(
        new AppError("Unknown action", 404, {
          toast: false,
        }),
      );
  }
});
