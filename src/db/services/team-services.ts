import { eq, type InferSelectModel } from "drizzle-orm";
import db from "~/db";
import * as userData from "~/db/data/participant";
import * as teamData from "~/db/data/teams";
import { notSelected, participants, teams } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";

type Team = InferSelectModel<typeof teams>;
type TeamWithMemberCount = Team & { memberCount: number };

export async function createTeam(userId: string, name: string) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  if (user.teamId)
    throw new AppError("ALREADY_IN_TEAM", 400, {
      title: "Already in team",
    });

  const existing = await teamData.findByName(name);
  if (existing)
    throw new AppError("TEAM_EXISTS", 400, {
      title: "Team name taken",
      description: "Try another name.",
    });

  return db.transaction(async (tx) => {
    const [team] = await tx
      .insert(teams)
      .values({ name, leaderId: user.id })
      .returning();

    await tx.insert(notSelected).values({
      teamId: team.id, // TODO: CHECK IF ITS BEING REMOVED WHEN ADDED IN OTHER TABLES
    });

    await tx
      .update(participants)
      .set({
        teamId: team.id,
        isLeader: true,
      })
      .where(eq(participants.id, userId));

    return team;
  });
}

export async function joinTeam(userId: string, teamId: string) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  if (user.teamId)
    throw new AppError("ALREADY_IN_TEAM", 400, {
      title: "Already in team",
    });

  const team = await teamData.findById(teamId);
  if (!team) {
    throw new AppError("TEAM_NOT_FOUND", 404);
  }

  if (team.isCompleted) {
    throw new AppError("TEAM_COMPLETED", 400, {
      title: "Team is completed",
      description: "This team is already completed. No new members can join.",
    });
  }

  const members = await teamData.listMembers(teamId);
  if (members.length >= 4) {
    throw new AppError("TEAM_FULL", 400, {
      title: "Team is full",
      description: "Maximum of 4 members are allowed in a team.",
    });
  }

  const memberWithCollege = members.find((m) => m.collegeId);

  if (memberWithCollege) {
    if (user.collegeId !== memberWithCollege.collegeId) {
      throw new AppError("COLLEGE_MISMATCH", 400, {
        title: "College mismatch",
        description:
          "All team members must be from the same college. This team is for a different college.",
      });
    }
  }

  return db.transaction(async (tx) => {
    await tx
      .update(participants)
      .set({
        teamId: teamId,
      })
      .where(eq(participants.id, userId));

    return team;
  });
}

export async function leaveTeam(userId: string) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  if (!user.teamId) {
    throw new AppError("NOT_IN_TEAM", 400, {
      title: "Not in a team",
      description: "You are not currently a member of any team.",
    });
  }

  if (user.isLeader) {
    throw new AppError("LEADER_CANNOT_LEAVE", 400, {
      title: "Leader cannot leave",
      description:
        "Team leaders cannot leave the team. Please confirm the team instead.",
    });
  }

  const team = await teamData.findById(user.teamId);
  if (team?.isCompleted) {
    throw new AppError("TEAM_COMPLETED", 400, {
      title: "Team is completed",
      description: "This team is already completed. Members cannot leave.",
    });
  }

  return db.transaction(async (tx) => {
    await tx
      .update(participants)
      .set({
        teamId: null,
        isLeader: false,
      })
      .where(eq(participants.id, userId));

    return team;
  });
}

export async function completeTeam(userId: string, teamId: string) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  if (user.teamId !== teamId) {
    throw new AppError("NOT_TEAM_MEMBER", 403, {
      title: "Not a member of this team",
      description: "You can only complete teams you are a member of.",
    });
  }

  if (!user.isLeader) {
    throw new AppError("NOT_LEADER", 403, {
      title: "Not a team leader",
      description: "Only team leaders can complete a team.",
    });
  }

  const team = await teamData.findById(teamId);
  if (!team) {
    throw new AppError("TEAM_NOT_FOUND", 404);
  }

  if (team.isCompleted) {
    throw new AppError("TEAM_ALREADY_COMPLETED", 400, {
      title: "Team already completed",
      description: "This team is already completed.",
    });
  }

  const members = await teamData.listMembers(teamId);
  if (members.length < 3 || members.length > 4) {
    throw new AppError(
      members.length < 3 ? "TEAM_TOO_SMALL" : "TEAM_TOO_LARGE",
      400,
      {
        title: members.length < 3 ? "Team too small" : "Team too large",
        description:
          members.length < 3
            ? "A team must have at least 3 members to be completed."
            : "A team cannot have more than 4 members.",
      },
    );
  }

  return db.transaction(async (tx) => {
    const [updatedTeam] = await tx
      .update(teams)
      .set({
        isCompleted: true,
      })
      .where(eq(teams.id, teamId))
      .returning();

    return updatedTeam;
  });
}

export async function deleteTeam(userId: string, teamId: string) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  if (!user.isLeader) {
    throw new AppError("NOT_LEADER", 403, {
      title: "Not a team leader",
      description: "Only team leaders can delete the team.",
    });
  }

  if (user.teamId !== teamId) {
    throw new AppError("NOT_TEAM_MEMBER", 403, {
      title: "Not a member of this team",
      description: "You can only delete teams you are a member of.",
    });
  }

  const team = await teamData.findById(teamId);
  if (!team) {
    throw new AppError("TEAM_NOT_FOUND", 404);
  }

  return db.transaction(async (tx) => {
    await tx
      .update(participants)
      .set({
        teamId: null,
        isLeader: false,
      })
      .where(eq(participants.teamId, teamId));

    await tx.delete(teams).where(eq(teams.id, teamId));

    return team;
  });
}

export async function fetchTeams({
  cursor,
  limit = 50,
}: {
  cursor?: string;
  limit?: number;
}): Promise<{ teams: TeamWithMemberCount[]; nextCursor: string | null }> {
  const allTeams = await db
    .select()
    .from(teams)
    .orderBy(teams.createdAt)
    .limit(limit + 1);

  let startIndex = 0;
  if (cursor) {
    startIndex = allTeams.findIndex((t) => t.id === cursor) + 1;
  }

  const paginatedTeams = allTeams.slice(startIndex, startIndex + limit);
  const hasMore = allTeams.length > startIndex + limit;
  const nextCursor = hasMore
    ? paginatedTeams[paginatedTeams.length - 1]?.id
    : null;

  const teamsWithCounts = await Promise.all(
    paginatedTeams.map(async (team) => {
      const members = await teamData.listMembers(team.id);
      return {
        ...team,
        memberCount: members.length,
      };
    }),
  );

  return {
    teams: teamsWithCounts,
    nextCursor,
  };
}

export async function getFormStatus(teamId: string) {
  const teamRes = await db.query.teams.findFirst({
    where: (t, { eq }) => eq(t.id, teamId),
    with: {
      notSelected: true,
      semiSelected: true,
      selected: true,
      ideaSubmission: true,
    },
  });
  if (!teamRes) {
    return "NOT_FOUND";
  }
  if (!teamRes.isCompleted) {
    return "NOT_COMPLETED";
  }
  const siteSettingsData = await db.query.siteSettings.findFirst();
  if (siteSettingsData?.resultsOut) {
    if (!teamRes.ideaSubmission) {
      return "IDEA_NOT_SUBMITTED";
    }
    if (teamRes.notSelected) {
      return "NOT_SELECTED";
    }
    if (teamRes.semiSelected) {
      return "NOT_SELECTED";
    }
    if (teamRes.selected) {
      if (
        siteSettingsData.paymentsOpen &&
        (teamRes?.paymentStatus === "Pending" ||
          teamRes?.paymentStatus === "Refunded")
      ) {
        return "PAYMENT_PENDING";
      } else if (
        siteSettingsData.paymentsOpen &&
        teamRes?.paymentStatus === "Paid"
      ) {
        return "PAYMENT_PAID";
      } else if (!siteSettingsData.paymentsOpen) {
        return "PAYMENT_NOT_OPEN";
      }
    }
  }
  if (teamRes.ideaSubmission) {
    return "IDEA_SUBMITTED";
  } else {
    return "IDEA_NOT_SUBMITTED";
  }
}
