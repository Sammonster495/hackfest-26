import { NextResponse } from "next/server";
import * as permissionsData from "~/db/data/permissions";

export async function GET() {
  try {
    const permissions = await permissionsData.listPermissions();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 },
    );
  }
}
