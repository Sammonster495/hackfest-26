import { and, desc, eq, ilike, lt, sql } from "drizzle-orm";
import { AppError } from "~/lib/errors/app-error";
import db from "..";
import { ideaSubmission, teams, tracks } from "../schema";

export async function submitIdea({
  teamId,
  pdfUrl,
  trackId,
  userId,
}: {
  teamId: string;
  pdfUrl: string;
  trackId: string;
  userId: string;
}) {
  try {
    const leader = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      columns: {
        leaderId: true,
      },
    });
    if (!leader || !(leader.leaderId === userId)) {
      throw new AppError("You are not the leader of this team", 400);
    }
    const [submitIdea] = await db
      .insert(ideaSubmission)
      .values({
        teamId,
        pptUrl: pdfUrl,
        trackId,
      })
      .returning();
    const res = submitIdea;
    return res;
  } catch (error) {
    console.error("Error submitting idea:", error);
    throw new AppError("Failed to submit idea", 500);
  }
}

export async function getIdeaSubmission(teamId: string) {
  try {
    const ideaSubmissionData = await db.query.ideaSubmission.findFirst({
      where: (submission, { eq }) => eq(submission.teamId, teamId),
      with: {
        track: true,
      },
    });
    const submission = ideaSubmissionData
      ? {
          pdfUrl: ideaSubmissionData.pptUrl,
          trackId: ideaSubmissionData.trackId,
          trackName: ideaSubmissionData.track?.name ?? "Unknown Track",
        }
      : null;
    return submission;
  } catch (error) {
    console.error("Error fetching idea submission:", error);
    throw new AppError("Failed to fetch idea submission", 500);
  }
}

export async function fetchIdeas({
  cursor,
  limit = 50,
  search,
  trackId,
}: {
  cursor?: string;
  limit?: number;
  search?: string;
  trackId?: string;
}) {
  try {
    const conditions = [];

    if (search) {
      conditions.push(ilike(teams.name, `%${search}%`));
    }

    if (cursor) {
      conditions.push(lt(ideaSubmission.createdAt, new Date(cursor)));
    }

    if (trackId) {
      conditions.push(eq(ideaSubmission.trackId, trackId));
    }

    const ideas = await db
      .select({
        id: ideaSubmission.id,
        teamId: ideaSubmission.teamId,
        pptUrl: ideaSubmission.pptUrl,
        trackId: ideaSubmission.trackId,
        createdAt: ideaSubmission.createdAt,
        team: {
          id: teams.id,
          name: teams.name,
        },
        track: {
          id: tracks.id,
          name: tracks.name,
        },
      })
      .from(ideaSubmission)
      .leftJoin(teams, eq(ideaSubmission.teamId, teams.id))
      .leftJoin(tracks, eq(ideaSubmission.trackId, tracks.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(ideaSubmission.createdAt))
      .limit(limit);

    let nextCursor: string | undefined;
    if (ideas.length === limit) {
      const lastIdea = ideas[ideas.length - 1];
      nextCursor = lastIdea.createdAt?.toISOString();
    }

    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(ideaSubmission)
      .leftJoin(teams, eq(ideaSubmission.teamId, teams.id))
      .where(search ? ilike(teams.name, `%${search}%`) : undefined);

    return {
      ideas,
      nextCursor,
      totalCount: count,
    };
  } catch (error) {
    console.error("Error fetching ideas:", error);
    throw new AppError("Failed to fetch ideas", 500);
  }
}
