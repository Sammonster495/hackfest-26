import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";
import {
  celeryTask,
  type GithubRepo,
  type Member,
  type RepoProperties,
  type Team,
  type User,
} from "~/lib/worker/task";
import db from "..";
import { query } from "../data";

export type SelectedTeams = {
  id: string;
  name: string;
  track: string;
  members: SelectedTeamMember[];
};

type SelectedTeamMember = {
  id: string;
  name: string;
  email: string;
  is_leader: boolean;
};

export async function getTop60Teams() {
  try {
    const selectedTeams = await db.query.teams.findMany({
      where: (t, { eq }) => eq(t.teamStage, "SELECTED"),
      with: {
        ideaSubmission: {
          with: {
            track: true,
          },
        },
      },
    });
    const participants = await query.participants.findMany({
      where: (p, { inArray }) =>
        inArray(
          p.teamId,
          selectedTeams.map((team) => team.id),
        ),
    });

    const teams: SelectedTeams[] = [];
    for (const team of selectedTeams) {
      const members = participants
        .filter((p) => p.teamId === team.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          is_leader: p.id === team.leaderId,
        })) as Array<SelectedTeamMember>;

      teams.push({
        id: team.id,
        name: team.name,
        track: team.ideaSubmission?.track.name || "N/A",
        members: members,
      });
    }

    return successResponse(teams, { toast: false });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to fetch top 60 teams", 500, {
        toast: false,
        title: "Failed to fetch top 60 teams",
      }),
    );
  }
}

export async function notifyTop60Leaders() {
  try {
    const selectedTeams = await db.query.teams.findMany({
      where: (t, { eq }) => eq(t.teamStage, "SELECTED"),
      with: {
        leader: true,
        ideaSubmission: {
          with: {
            track: true,
          },
        },
      },
    });

    const users: Array<User> = [];
    for (const team of selectedTeams) {
      if (team.leader.email) {
        users.push({
          id: team.leader.id,
          name: team.leader.name ?? "noname",
          username: team.leader.github ?? "nousername",
          email: team.leader.email,
          track: team.ideaSubmission?.track.name || "N/A",
          is_leader: true,
          team_name: team.name,
        } as User);
      }
    }

    celeryTask.top60TeamsNotificationTask(users);

    return successResponse(null, {
      toast: true,
      title: "Notification sent to top 60 leaders",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to notify top 60 leaders", 500, {
        toast: true,
        title: "Failed to notify top 60 leaders",
      }),
    );
  }
}

export async function notifyAllTop60Participants() {
  try {
    const selectedTeams = await db.query.teams.findMany({
      where: (t, { eq }) => eq(t.teamStage, "SELECTED"),
      with: {
        ideaSubmission: {
          with: {
            track: true,
          },
        },
      },
    });
    const participants = await query.participants.findMany({
      where: (p, { inArray }) =>
        inArray(
          p.teamId,
          selectedTeams.map((team) => team.id),
        ),
    });

    const users: Array<User> = [];
    for (const team of selectedTeams) {
      const teamParticipants = participants.filter((p) => p.teamId === team.id);
      for (const participant of teamParticipants) {
        if (participant.email === null) continue;

        users.push({
          id: participant.id,
          name: participant.name ?? "noname",
          username: participant.github ?? "nousername",
          email: participant.email,
          track: team.ideaSubmission?.track.name || "N/A",
          is_leader: participant.id === team.leaderId,
          team_name: team.name,
        } as User);
      }
    }

    celeryTask.top60TeamsNotificationTask(users);

    return successResponse(null, {
      toast: true,
      title: "Notification sent to top 60 participants",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to notify top 60 participants", 500, {
        toast: true,
        title: "Failed to notify top 60 participants",
      }),
    );
  }
}

export async function getAttendedTeams() {
  try {
    const attendedTeams = await db.query.teams.findMany({
      where: (t, { eq }) => eq(t.attended, true),
      with: {
        users: true,
      },
    });

    const githubEntries = await db.query.githubs.findMany();
    const completedTeamIds = new Set(githubEntries.map((g) => g.teamId));

    attendedTeams.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      return nameA.localeCompare(nameB);
    });

    const teams: Array<Team> = [];
    for (let i = 0; i < attendedTeams.length; i++) {
      const team = attendedTeams[i];
      teams.push({
        team_id: team.id,
        team_no: i + 1,
        team_name: team.name,
        completed: completedTeamIds.has(team.id),
        members: team.users.map(
          (user) =>
            ({
              id: user.id,
              name: user.name,
              username: user.github ?? "nousername",
              email: user.email,
            }) as Member,
        ),
      });
    }

    return successResponse(teams, { toast: false });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to fetch attended teams", 500, {
        toast: false,
        title: "Failed to fetch attended teams",
      }),
    );
  }
}

export async function triggerGithubRepoAutomationForTeams(
  teamIds: Array<string>,
) {
  try {
    const selectedTeams = await db.query.teams.findMany({
      where: (t, { inArray }) => inArray(t.id, teamIds),
      with: {
        users: true,
        selected: true,
      },
    });

    const teams: Array<Team> = [];
    for (let i = 0; i < selectedTeams.length; i++) {
      const team = selectedTeams[i];
      teams.push({
        team_id: team.id,
        team_no: team.selected.teamNo ?? 0,
        team_name: team.name,
        members: team.users.map(
          (user) =>
            ({
              id: user.id,
              name: user.name,
              username: user.github ?? "nousername",
              email: user.email,
            }) as Member,
        ),
      });
    }

    await celeryTask.automateGithubRepoCreationTask(teams);

    return successResponse(true, {
      toast: true,
      title: "Automation triggered for selected teams",
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to trigger automation", 500, {
        toast: true,
        title: "Failed to trigger automation",
      }),
    );
  }
}

export async function toggleGithubCommitStatus(enabled: boolean) {
  try {
    const github = await db.query.githubs.findMany({
      with: {
        githubTeam: true,
        githubRepo: true,
      },
    });

    if (github.length === 0) {
      return errorResponse(
        new AppError("No GitHub repositories found", 404, {
          toast: true,
          title: "No GitHub repositories found",
          description: "Please sync GitHub repositories first",
        }),
      );
    }

    let teamProperty: Partial<RepoProperties> = {};
    if (enabled) {
      teamProperty = {
        toggle_access: true,
        permission: "push",
      };
    } else {
      teamProperty = {
        toggle_access: true,
        permission: "pull",
      };
    }

    const githubProperties: Array<RepoProperties> = github.map(
      (team) =>
        ({
          toggle_visibility: false,
          private: true, // does not matter when toggle_visibility is false

          toggle_access: teamProperty.toggle_access,
          permission: teamProperty.permission,
          team_slug: team.githubTeam.githubTeamSlug,
          repo: team.githubRepo.githubRepoName,

          github_repo: null, // does not matter when toggle_visibility is false
          github_team: null,
        }) as RepoProperties,
    );

    await celeryTask.updateRepoPropertiesTask(githubProperties);

    return successResponse(enabled, {
      toast: true,
      title: `GitHub commit status ${enabled ? "enabled" : "disabled"}`,
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to toggle commit status", 500, {
        toast: true,
        title: "Failed to toggle commit status",
      }),
    );
  }
}

export async function toggleGithubRepoPrivacy(make_private: boolean) {
  try {
    const githubRepos = await db.query.githubRepos.findMany();

    if (githubRepos.length === 0) {
      return errorResponse(
        new AppError("No GitHub repositories found", 404, {
          toast: true,
          title: "No GitHub repositories found",
          description: "Please sync GitHub repositories first",
        }),
      );
    }

    let repoProperty: Partial<RepoProperties>;
    if (make_private) {
      repoProperty = {
        toggle_visibility: true,
        private: true,
      };
    } else {
      repoProperty = {
        toggle_visibility: true,
        private: false,
      };
    }

    const githubProperties: Array<RepoProperties> = githubRepos.map(
      (repo) =>
        ({
          toggle_visibility: repoProperty.toggle_visibility,
          private: repoProperty.private,

          // does not matter when toggle_access is false
          toggle_access: false,
          permission: "pull",
          team_slug: "",
          repo: "",

          github_repo: {
            id: repo.githubRepoId,
            name: repo.githubRepoName,
            full_name: repo.githubRepoFullName,
            url: repo.githubRepoUrl,
            html_url: repo.githubRepoHtmlUrl,
          } as GithubRepo,
          github_team: null, // does not matter when toggle_access is false
        }) as RepoProperties,
    );

    console.log("Toggling GitHub repo privacy for repos:", githubProperties);

    await celeryTask.updateRepoPropertiesTask(githubProperties);

    return successResponse(make_private, {
      toast: true,
      title: `GitHub repository privacy ${make_private ? "set to private" : "set to public"}`,
    });
  } catch (_error) {
    return errorResponse(
      new AppError("Failed to toggle commit status", 500, {
        toast: true,
        title: "Failed to toggle commit status",
      }),
    );
  }
}
