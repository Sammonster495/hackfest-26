import { NextResponse } from "next/server";
import { z } from "zod";
import { adminProtected } from "~/auth/routes-wrapper";
import {
  listEvaluatorAccessRoles,
  setRoleEvaluatorAccess,
} from "~/db/services/submission-services";
import { errorResponse } from "~/lib/response/error";

const updateSchema = z.object({
  roleId: z.string().min(1),
  enabled: z.boolean(),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = adminProtected(async () => {
  try {
    const data = await listEvaluatorAccessRoles();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});

export const PUT = adminProtected(async (request) => {
  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const result = await setRoleEvaluatorAccess(parsed);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
});
