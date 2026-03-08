import { NextResponse } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import * as permissionsData from "~/db/data/permissions";

export const GET = adminProtected(async () => {
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
});
