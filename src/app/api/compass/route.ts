import { NextResponse } from "next/server";
import { auth } from "~/auth/config";
import { getCompassData } from "~/db/services/team-services";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const result = await getCompassData(session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Compass API error:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
