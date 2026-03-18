import { type NextRequest, NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { fetchAllAllocations } from "~/db/services/idea-services";

export const GET = adminProtected(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json(
        { message: "roundId is required" },
        { status: 400 },
      );
    }

    const result = await fetchAllAllocations(roundId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching allocations:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch allocations";
    const status = (error as any).statusCode || 500;
    return NextResponse.json({ message }, { status });
  }
});
