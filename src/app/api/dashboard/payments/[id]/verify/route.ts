import type { NextRequest } from "next/server";
import { adminProtected } from "~/auth/routes-wrapper";
import { togglePaymentVerification } from "~/db/services/payment-services";
import { successResponse } from "~/lib/response/success";

export const PATCH = adminProtected(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const params = await ctx.params;
    const { id: paymentId } = params as { id: string };

    const result = await togglePaymentVerification(paymentId);

    return successResponse(result, {
      title:
        result.paymentStatus === "Paid"
          ? "Payment verified"
          : "Payment unverified",
      description:
        result.paymentStatus === "Paid"
          ? "Payment has been marked as verified."
          : "Payment has been marked as pending.",
    });
  },
);
