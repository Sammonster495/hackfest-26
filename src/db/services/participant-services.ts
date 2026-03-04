import {
  and,
  asc,
  count,
  eq,
  gt,
  type InferSelectModel,
  ilike,
  isNotNull,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import db from "~/db";
import * as userData from "~/db/data/participant";
import { colleges, participants } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import type { UpdateParticipantInput } from "~/lib/validation/participant";

type Participant = InferSelectModel<typeof participants>;
type ParticipantRow = Pick<
  Participant,
  | "id"
  | "name"
  | "email"
  | "phone"
  | "gender"
  | "course"
  | "isRegistrationComplete"
  | "createdAt"
> & {
  collegeName: string | null;
  hasTeam: boolean;
  teamId: string | null;
};

export async function getUserProfile(userId: string) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);
  return user;
}

export async function getUserByEmail(email: string) {
  const user = await userData.findByEmail(email);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);
  return user;
}

export async function listUsers() {
  return userData.listUsers();
}

export async function updateUserProfile(
  userId: string,
  data: UpdateParticipantInput,
) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  return userData.updateUser(userId, data);
}

export async function fetchParticipants({
  cursor,
  limit = 50,
  search,
  filter,
}: {
  cursor?: string;
  limit?: number;
  search?: string;
  filter?: {
    isRegistrationComplete?: string;
    hasTeam?: string;
    gender?: string;
  };
}): Promise<{
  participants: ParticipantRow[];
  nextCursor: string | null;
  totalCount: number;
  registeredCount: number;
}> {
  "use cache";
  cacheLife("seconds");
  cacheTag("participants");

  const conditions: SQL[] = [];

  if (cursor) {
    const cursorParticipant = await db
      .select({ createdAt: participants.createdAt })
      .from(participants)
      .where(eq(participants.id, cursor))
      .limit(1);

    if (cursorParticipant[0]) {
      conditions.push(
        gt(participants.createdAt, cursorParticipant[0].createdAt),
      );
    }
  }

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(ilike(participants.name, term), ilike(participants.email, term))!,
    );
  }

  if (
    filter?.isRegistrationComplete &&
    filter.isRegistrationComplete !== "all"
  ) {
    conditions.push(
      eq(
        participants.isRegistrationComplete,
        filter.isRegistrationComplete === "true",
      ),
    );
  }
  if (filter?.hasTeam && filter.hasTeam !== "all") {
    conditions.push(
      filter.hasTeam === "true"
        ? isNotNull(participants.teamId)
        : isNull(participants.teamId),
    );
  }
  if (filter?.gender && filter.gender !== "all") {
    conditions.push(
      eq(
        participants.gender,
        filter.gender as "Male" | "Female" | "Prefer Not To Say",
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      id: participants.id,
      name: participants.name,
      email: participants.email,
      phone: participants.phone,
      gender: participants.gender,
      course: participants.course,
      isRegistrationComplete: participants.isRegistrationComplete,
      createdAt: participants.createdAt,
      collegeName: colleges.name,
      teamId: participants.teamId,
    })
    .from(participants)
    .leftJoin(colleges, eq(participants.collegeId, colleges.id))
    .where(whereClause)
    .orderBy(asc(participants.createdAt))
    .limit(limit + 1);

  const hasMore = result.length > limit;
  const paginated = hasMore ? result.slice(0, limit) : result;
  const nextCursor = hasMore
    ? (paginated[paginated.length - 1]?.id ?? null)
    : null;

  const rows: ParticipantRow[] = paginated.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    gender: r.gender,
    course: r.course,
    isRegistrationComplete: r.isRegistrationComplete,
    createdAt: r.createdAt,
    collegeName: r.collegeName,
    hasTeam: r.teamId !== null,
    teamId: r.teamId,
  }));

  const [[totalResult], [registeredResult]] = await Promise.all([
    db.select({ count: count() }).from(participants),
    db
      .select({ count: count() })
      .from(participants)
      .where(eq(participants.isRegistrationComplete, true)),
  ]);

  return {
    participants: rows,
    nextCursor,
    totalCount: totalResult?.count ?? 0,
    registeredCount: registeredResult?.count ?? 0,
  };
}
