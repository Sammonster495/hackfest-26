import * as collegeData from "~/db/data/colleges";
import { successResponse } from "~/lib/response/success";
import { protectedRoute } from "~/auth/route-handlers";
import { NextRequest } from "next/server";

export const GET = protectedRoute(async (_request: NextRequest, _context) => {
  const colleges = await collegeData.listColleges();
  return successResponse({ colleges });
});
