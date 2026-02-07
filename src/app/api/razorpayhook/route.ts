import { webhookCapture } from "~/db/services/payment-services";
import { env } from "~/env";
import { verifyRazorpaySignature } from "~/lib/razorpay/verify";

export const POST = async (req: Request) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const secret = env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not defined");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const isAuthentic = verifyRazorpaySignature(rawBody, signature, secret);

  if (!isAuthentic) {
    console.error("Invalid signature for Razorpay webhook");
    return new Response(
      JSON.stringify({ success: false, error: "Invalid signature" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
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
      );
      console.log("Payment captured successfully:", paymentId);
    } catch (error) {
      console.error("Error capturing payment:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to capture payment" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment captured successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
