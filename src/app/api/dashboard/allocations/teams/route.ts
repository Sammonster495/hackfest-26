import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { getSelectedTeamsForAllocation } from "~/db/services/allocation-services";
import { errorResponse } from "~/lib/response/error";

export const GET = adminProtected(async (_req: NextRequest) => {
  try {
    const teams = await getSelectedTeamsForAllocation();
    return NextResponse.json({ teams });
  } catch (error) {
    return errorResponse(error);
  }
});
