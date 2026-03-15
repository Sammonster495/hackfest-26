import { NextResponse } from "next/server";
import { permissionProtected } from "~/auth/routes-wrapper";
import { getPaymentsForDashboard } from "~/db/services/payment-services";

export const GET = permissionProtected(
  ["payment:manage"],
  async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? undefined;
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const result = await getPaymentsForDashboard({
      page,
      limit,
      search,
      sortOrder,
    });

    return NextResponse.json(result);
  },
);
