import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import db from "~/db";
import { AppError } from "~/lib/errors/app-error";
import { type StateEnum, stateEnum } from "../enum";
import { collegeRequests, colleges } from "../schema";

export async function fetchCollegesPaginated({
  cursor,
  limit = 50,
  search,
}: {
  cursor?: string;
  limit?: number;
  search?: string;
}) {
  const query = db.select().from(colleges).orderBy(asc(colleges.name));

  let whereClause: SQL | undefined;
  if (search) {
    whereClause = ilike(colleges.name, `%${search}%`);
  }

  // Need to correctly paginate by offset or cursor in postgres
  // We'll use offset pagination here for simplicity, where cursor is interpreted as an offset.
  const offset = cursor ? parseInt(cursor, 10) : 0;

  if (whereClause) {
    query.where(whereClause);
  }

  const results = await query.offset(offset).limit(limit + 1);
  const totalCountResult = await db
    .select({ count: count() })
    .from(colleges)
    .where(whereClause);

  let nextCursor: string | null = null;
  let returnedColleges = results;

  if (results.length > limit) {
    returnedColleges = results.slice(0, limit);
    nextCursor = String(offset + limit);
  }

  return {
    colleges: returnedColleges,
    nextCursor,
    totalCount: totalCountResult[0]?.count ?? 0,
  };
}

export async function fetchCollegeRequests({
  cursor,
  limit = 50,
  search,
  status,
}: {
  cursor?: string;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const query = db
    .select()
    .from(collegeRequests)
    .orderBy(desc(collegeRequests.createdAt));
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(collegeRequests.requested_name, `%${search}%`),
        ilike(collegeRequests.approved_name, `%${search}%`),
      ),
    );
  }

  if (status && status !== "all") {
    // Assuming status matches the enum 'Pending' | 'Approved' | 'Rejected'
    conditions.push(
      eq(collegeRequests.status, status as "Pending" | "Approved" | "Rejected"),
    );
  }

  const drizzleConditions =
    conditions.length > 0 ? and(...conditions) : undefined;

  if (drizzleConditions) {
    query.where(drizzleConditions);
  }

  const offset = cursor ? parseInt(cursor, 10) : 0;
  const results = await query.offset(offset).limit(limit + 1);
  const totalCountResult = await db
    .select({ count: count() })
    .from(collegeRequests)
    .where(drizzleConditions);

  let nextCursor: string | null = null;
  let returnedRequests = results;

  if (results.length > limit) {
    returnedRequests = results.slice(0, limit);
    nextCursor = String(offset + limit);
  }

  return {
    requests: returnedRequests,
    nextCursor,
    totalCount: totalCountResult[0]?.count ?? 0,
  };
}

export async function getCollegeRequestCounts() {
  const results = await db
    .select({
      status: collegeRequests.status,
      count: count(),
    })
    .from(collegeRequests)
    .groupBy(collegeRequests.status);

  const counts: Record<string, number> = {
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  };
  for (const r of results) {
    if (r.status) counts[r.status] = r.count;
  }

  return counts;
}

export async function getCollegesCount() {
  const result = await db.select({ count: count() }).from(colleges);
  return result[0]?.count ?? 0;
}

export async function updateCollegeRequestStatus(
  id: string,
  status: "Pending" | "Approved" | "Rejected",
  approvedName?: string,
  stateOverride?: string,
) {
  return await db.transaction(async (tx) => {
    const updatePayload: {
      status: "Pending" | "Approved" | "Rejected";
      approved_name?: string | null;
      state?: StateEnum;
    } = { status };
    if (approvedName) {
      updatePayload.approved_name = approvedName;
    }
    if (stateOverride) {
      if (!stateEnum.enumValues.includes(stateOverride as StateEnum)) {
        throw new AppError("BAD_REQUEST", 400, {
          title: "Invalid State in Request",
          description: `The state '${stateOverride}' is not a valid state.`,
        });
      }
      updatePayload.state = stateOverride as StateEnum;
    }

    const [updatedRequest] = await tx
      .update(collegeRequests)
      .set(updatePayload)
      .where(eq(collegeRequests.id, id))
      .returning();

    if (!updatedRequest) {
      throw new Error("College request not found");
    }

    // If approved, insert into colleges
    if (status === "Approved") {
      const finalName =
        updatedRequest.approved_name || updatedRequest.requested_name;
      const state = updatedRequest.state;

      if (!stateEnum.enumValues.includes(state as StateEnum)) {
        throw new AppError("BAD_REQUEST", 400, {
          title: "Invalid State in Request",
          description: `The state '${state}' is not a valid state.`,
        });
      }

      await tx
        .insert(colleges)
        .values({
          name: finalName,
          state: state as StateEnum,
        })
        .onConflictDoNothing(); // prevent duplicates if already somehow inserted
    }

    return updatedRequest;
  });
}

export async function createCollegeRequest(
  customCollegeName: string,
  state: string,
) {
  if (!stateEnum.enumValues.includes(state as StateEnum)) {
    throw new AppError("BAD_REQUEST", 400, {
      title: "Invalid State",
      description: `The state '${state}' is not recognized.`,
    });
  }

  const [newRequest] = await db
    .insert(collegeRequests)
    .values({
      requested_name: customCollegeName,
      state: state as StateEnum,
      status: "Pending",
    })
    .returning();

  return newRequest;
}
