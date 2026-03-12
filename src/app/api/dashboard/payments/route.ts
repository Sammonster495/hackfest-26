import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
// import { getPayments } from "~/db/services/payment-services";
// TODO: SUMUKHA: Make use of this file for payments
export const GET = adminProtected(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const _page = Number(searchParams.get("page") ?? "1");
  const _limit = Number(searchParams.get("limit") ?? "20");
  const _status = searchParams.get("status") as
    | "Pending"
    | "Paid"
    | "Refunded"
    | undefined;
  const _search = searchParams.get("search") ?? undefined;
  const _sortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const _type = searchParams.get("type") as
    | "PARTICIPATION"
    | "EVENT"
    | "ALL"
    | undefined;

  // const result = await getPayments({
  //   page,
  //   limit,
  //   status: status || undefined,
  //   search: search || undefined,
  //   sortOrder,
  //   type,
  // });

  return NextResponse.json("");
});
