import { type NextRequest, NextResponse } from "next/server";
import { auth as participantAuth } from "~/auth/config";
import { auth as eventAuth } from "~/auth/event-config";
import { publicRoute } from "~/auth/route-handlers";
import { createOrder, savePayment } from "~/db/services/payment-services";
import { rateLimiters } from "~/lib/rate-limit";

export const POST = publicRoute(async (req: NextRequest, _context) => {
  let body = null;
  const action = req.nextUrl.pathname.split("/").pop() || "";
  console.log("Payment route action:", action);

  if (["create-order", "save-payment"].includes(action)) {
    body = await req.json();
  }

  const hfSession = await participantAuth();
  const eventSession = await eventAuth();

  try {
    switch (action) {
      case "create-order": {
        return NextResponse.json(
          await createOrder({
            ...body,
            sessionUserId:
              body.paymentType === "EVENT"
                ? eventSession?.eventUser?.id
                : (hfSession?.user?.id ?? ""),
          }),
        );
      }
      case "save-payment": {
        return NextResponse.json(
          await savePayment({
            ...body,
            sessionUserId:
              body.paymentType === "EVENT"
                ? eventSession?.eventUser?.id
                : (hfSession?.user?.id ?? ""),
          }),
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
}, rateLimiters.payment);
