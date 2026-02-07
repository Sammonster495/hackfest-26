import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/auth/dashboard-config";
import {
  createTrack,
  deleteTrack,
  getTracks,
} from "~/db/services/track-services";
import { isAdmin } from "~/lib/auth/check-access";
import { AppError } from "~/lib/errors/app-error";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.dashboardUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tracks = await getTracks();
    return NextResponse.json(tracks);
  } catch (error) {
    if (error instanceof AppError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.dashboardUser || !isAdmin(session.dashboardUser)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return new NextResponse("Track name is required", { status: 400 });
    }

    const track = await createTrack({ name });
    return NextResponse.json(track);
  } catch (error) {
    if (error instanceof AppError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.dashboardUser || !isAdmin(session.dashboardUser)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Track ID is required", { status: 400 });
    }

    await deleteTrack(id);
    return new NextResponse("Track deleted successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
