import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { autoAssignLabs } from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const POST = adminProtected(async (_req: NextRequest) => {
  try {
    const result = await autoAssignLabs();
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
});
