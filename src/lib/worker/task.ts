import { eq } from "drizzle-orm/sql/expressions/conditions";
import { v7 as uuid7 } from "uuid";
import db from "~/db";
import { query } from "~/db/data";
import { githubRepos, githubs, githubTeams } from "~/db/schema";
import { AppError } from "../errors/app-error";
import { rabbitMQClient } from "../rabbit";
import { errorResponse } from "../response/error";
import { successResponse } from "../response/success";

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  track: string;
  is_leader: boolean;
  team_name: string;
};

export type Member = {
  id: string;
  name: string;
  username: string;
  email: string;
};

export type Team = {
  team_id: string;
  team_no: number;
  team_name: string;
  members: Array<Member>;
};

export type RepoProperties = {
  toggle_visibility: boolean;
  private: boolean;

  toggle_access: boolean;
  permission: "pull" | "push" | "admin";
  privacy: "secret" | "closed";

  github_repo: GithubRepo | null;
  github_team: GithubTeam | null;
};

export type GithubTeam = {
  id: number;
  name: string;
  slug: string;
  url: string;
  html_url: string;
};

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  url: string;
  html_url: string;
};

class CeleryTask {
  constructor() {
    console.log("Initializing Celery Task Manager");
  }

  public createTask(
    taskName: string,
    payload: { data: unknown },
  ): { id: string; task: string; args: Array<unknown> } {
    return {
      id: uuid7(),
      task: taskName,
      args: [payload],
    };
  }

  public async sendTask(payload: Message) {
    await rabbitMQClient.sendMessage(payload);
  }

  public async top60TeamsNotificationTask(users: Array<User>) {
    await this.sendTask(
      this.createTask("task.pipeline.automate.selected_teams_notification", {
        data: users,
      }),
    );
  }

  public async automateGithubRepoCreationTask(team: Array<Team>) {
    await this.sendTask(
      this.createTask("task.pipeline.automate.hackathon_github", {
        data: team,
      }),
    );
  }

  public async updateRepoPropertiesTask(
    githubProperties: Array<RepoProperties>,
  ) {
    await this.sendTask(
      this.createTask("task.pipeline.automate.update_repo_properties", {
        data: githubProperties,
      }),
    );
  }

  public async syncGithubTeam(teamId: string, githubTeam: GithubTeam) {
    try {
      const github = await query.github.findOne({
        where: eq(githubs.teamId, teamId),
      });

      let result: boolean = false;
      // first time sync, create new record
      if (!github) {
        result = await db.transaction(async (tx) => {
          const newGithub = await tx
            .insert(githubs)
            .values({
              teamId,
            })
            .returning();

          if (newGithub.length === 0) {
            tx.rollback();
            return false;
          }

          const newGithubTeam = await tx
            .insert(githubTeams)
            .values({
              githubId: newGithub[0].id,
              githubTeamId: githubTeam.id,
              githubTeamName: githubTeam.name,
              githubTeamSlug: githubTeam.slug,
              githubTeamUrl: githubTeam.url,
              githubTeamHtmlUrl: githubTeam.html_url,
            })
            .returning();

          if (newGithubTeam.length === 0) {
            tx.rollback();
            return false;
          }

          return true;
        });
        // subsequent sync, update existing record
      } else {
        result = await db
          .insert(githubTeams)
          .values({
            githubId: github.id,
            githubTeamId: githubTeam.id,
            githubTeamName: githubTeam.name,
            githubTeamSlug: githubTeam.slug,
            githubTeamUrl: githubTeam.url,
            githubTeamHtmlUrl: githubTeam.html_url,
          })
          .returning()
          .then((res) => res.length > 0);
      }

      if (!result) {
        return errorResponse(
          new AppError("Sync failed: Database error", 500, {
            toast: false,
          }),
        );
      }

      return successResponse(true, {
        toast: false,
        title: "GitHub Team synced successfully",
      });
    } catch (error) {
      return errorResponse(
        new AppError("Internal Server Error", 500, {
          toast: false,
          description: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }
  }

  public async syncGithubRepo(teamId: string, githubRepo: GithubRepo) {
    try {
      const github = await query.github.findOne({
        where: eq(githubs.teamId, teamId),
      });

      let result: boolean = false;
      // first time sync, create new record
      if (!github) {
        result = await db.transaction(async (tx) => {
          const newGithub = await tx
            .insert(githubs)
            .values({
              teamId,
            })
            .returning();

          if (newGithub.length === 0) {
            tx.rollback();
            return false;
          }

          const newGithubRepo = await tx
            .insert(githubRepos)
            .values({
              githubId: newGithub[0].id,
              githubRepoId: githubRepo.id,
              githubRepoName: githubRepo.name,
              githubRepoFullName: githubRepo.full_name,
              githubRepoUrl: githubRepo.url,
              githubRepoHtmlUrl: githubRepo.html_url,
            })
            .returning();

          if (newGithubRepo.length === 0) {
            tx.rollback();
            return false;
          }

          return true;
        });
        // subsequent sync, update existing record
      } else {
        result = await db
          .insert(githubRepos)
          .values({
            githubId: github.id,
            githubRepoId: githubRepo.id,
            githubRepoName: githubRepo.name,
            githubRepoFullName: githubRepo.full_name,
            githubRepoUrl: githubRepo.url,
            githubRepoHtmlUrl: githubRepo.html_url,
          })
          .returning()
          .then((res) => res.length > 0);
      }

      if (!result) {
        return errorResponse(
          new AppError("Sync failed: Database error", 500, {
            toast: false,
          }),
        );
      }

      return successResponse(true, {
        toast: false,
        title: "GitHub Repo synced successfully",
      });
    } catch (error) {
      return errorResponse(
        new AppError("Internal Server Error", 500, {
          toast: false,
          description: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }
  }
}

const globalForCeleryTask = global as unknown as {
  celeryTask?: CeleryTask;
};

function getCeleryTask(): CeleryTask {
  if (!globalForCeleryTask.celeryTask) {
    globalForCeleryTask.celeryTask = new CeleryTask();
  }
  return globalForCeleryTask.celeryTask;
}

export const celeryTask = getCeleryTask();

export type Message = ReturnType<typeof celeryTask.createTask>;
