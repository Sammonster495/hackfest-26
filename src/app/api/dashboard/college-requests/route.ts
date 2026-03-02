import { NextResponse } from "next/server";
import { permissionProtected, type RouteContext } from "~/auth/routes-wrapper";
import {
    fetchCollegeRequests,
    updateCollegeRequestStatus,
} from "~/db/services/college-requests";

export const GET = permissionProtected(
    ["dashboard:access"],
    async (request: Request, _context: RouteContext) => {
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get("cursor") || undefined;
        const limit = Number(searchParams.get("limit")) || 50;
        const search = searchParams.get("search") || undefined;
        const status = searchParams.get("status") || "all";

        const { requests, nextCursor, totalCount } = await fetchCollegeRequests({
            cursor,
            limit,
            search,
            status,
        });

        return NextResponse.json({
            requests,
            nextCursor,
            totalCount,
        });
    },
);

export const PATCH = permissionProtected(
    ["dashboard:access"],
    async (request: Request, _context: RouteContext) => {
        try {
            const body = await request.json();
            const { id, status, approvedName } = body;

            if (!id || !status) {
                return NextResponse.json(
                    { message: "Missing required fields" },
                    { status: 400 },
                );
            }

            const updatedRequest = await updateCollegeRequestStatus(
                id,
                status,
                approvedName,
            );

            return NextResponse.json({ request: updatedRequest });
        } catch (error) {
            console.error("Error updating college request:", error);
            return NextResponse.json(
                { message: "Internal server error" },
                { status: 500 },
            );
        }
    },
);
