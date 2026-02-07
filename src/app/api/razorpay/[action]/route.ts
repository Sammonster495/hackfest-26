import { NextResponse, type NextRequest } from "next/server";
import { createOrder, savePayment } from "~/db/services/payment-services";
import { registrationRequiredRoute } from "~/auth/route-handlers";

export const POST = registrationRequiredRoute(async (req: NextRequest, _context, user) => {
    let body = null;
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";
    console.log("Payment route action:", action);

    if (["create-order", "save-payment"].includes(action)) {
        body = await req.json();
    }

    try {
        switch (action) {
            case "create-order": {
                return NextResponse.json(
                    await createOrder({ ...body, sessionUserId: user.id }),
                );
            }
            case "save-payment": {
                return NextResponse.json(
                    await savePayment({ ...body, sessionUserId: user.id }),
                );
            }
            default:
                return NextResponse.json(
                    { success: false, error: "Unknown action" },
                    { status: 400 },
                );
        }
    } catch (error) {
        console.error("Payment route error:", error);
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            {
                statusText:
                    ((error as Error).cause as string) || "Internal Server Error",
            },
        );
    }
});
