import { NextRequest } from "next/server";
import { publicRoute } from "~/auth/route-handlers";
import { adminProtected } from "~/auth/routes-wrapper";
import db from "~/db";
import { AppError } from "~/lib/errors/app-error";
import { errorResponse } from "~/lib/response/error";
import { successResponse } from "~/lib/response/success";

export const GET = adminProtected(async (req: NextRequest) => {
  const query = req.nextUrl.searchParams;
  const entity = query.get("get") || "labs";

  switch (entity) {
    case "labs":
      try {
        const labs = await db.query.lab.findMany({
          columns: {
            id: true,
            name: true,
          },
        });

        return successResponse(labs, {
          toast: false,
        });
      } catch (error) {
        return errorResponse(
          new AppError("Failed to fetch labs", 500, {
            toast: true,
          }),
        );
      }

    default:
      return errorResponse(
        new AppError("Unknown query", 404, {
          toast: false,
        }),
      );
  }
});
