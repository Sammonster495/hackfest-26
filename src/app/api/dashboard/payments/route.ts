import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { getPayments } from "~/db/services/payment-services";

export const GET = adminProtected(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status") as
    | "Pending"
    | "Paid"
    | "Refunded"
    | undefined;
  const search = searchParams.get("search") ?? undefined;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const type = searchParams.get("type") as
    | "PARTICIPATION"
    | "EVENT"
    | "ALL"
    | undefined;

  const result = await getPayments({
    page,
    limit,
    status: status || undefined,
    search: search || undefined,
    sortOrder,
    type,
  });

  return NextResponse.json(result);
});
