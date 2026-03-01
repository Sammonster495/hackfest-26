import { type NextRequest, NextResponse } from "next/server";
import { publicRoute } from "~/auth/route-handlers";
import { webhookCapture } from "~/db/services/payment-services";
import { env } from "~/env";
import { rateLimiters } from "~/lib/rate-limit";
import { verifyRazorpaySignature } from "~/lib/razorpay/verify";

export const POST = publicRoute(async (req: NextRequest) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const secret = env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not defined");
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 },
    );
  }

  const isAuthentic = verifyRazorpaySignature(rawBody, signature, secret);

  if (!isAuthentic) {
    console.error("Invalid signature for Razorpay webhook");
    return NextResponse.json(
      { success: false, error: "Invalid signature" },
      { status: 400 },
    );
  }

  const data = JSON.parse(rawBody);

  if (data.event === "payment.captured") {
    console.log("Payment captured event received:", data.payload);
    const paymentId = data.payload.payment.entity.id;
    const paymentSignature = signature;
    const orderId = data.payload.payment.entity.order_id;
    const amount = parseInt(data.payload.payment.entity.amount, 10) / 100;
    const paymentType = data.payload.payment.entity.notes?.paymentType;
    const paymentName = data.payload.payment.entity.notes?.paymentName;
    const sessionUserId = parseInt(
      data.payload.payment.entity.notes?.sessionUserId,
      10,
    );
    const teamId = data.payload.payment.entity.notes?.teamId;
    const eventTeamId = data.payload.payment.entity.notes?.eventTeamId;

    try {
      await webhookCapture(
        paymentId,
        orderId,
        amount,
        paymentType,
        paymentName,
        sessionUserId,
        paymentSignature || "webhook-capture",
        teamId,
        eventTeamId,
      );
      console.log("Payment captured successfully:", paymentId);
    } catch (error) {
      console.error("Error capturing payment:", error);
      return NextResponse.json(
        { success: false, error: "Failed to capture payment" },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Payment captured successfully",
    });
  }
  return NextResponse.json({ success: true, message: "Event ignored" });
}, rateLimiters.payment);
