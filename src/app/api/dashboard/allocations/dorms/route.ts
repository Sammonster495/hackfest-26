import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  createDorm,
  listDormsWithOccupancy,
} from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (_req: NextRequest) => {
  try {
    const dorms = await listDormsWithOccupancy();
    return NextResponse.json({ dorms });
  } catch (error) {
    return errorResponse(error);
  }
});

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["Male", "Female", "Prefer Not To Say"]),
});

export const POST = adminProtected(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }
    const dorm = await createDorm(result.data.name, result.data.gender);
    return NextResponse.json({ dorm }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
});
