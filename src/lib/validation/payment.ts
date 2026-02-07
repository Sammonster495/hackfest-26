import { z } from "zod";

const createOrderSchema = z.object({
  amountInInr: z.number(),
  teamId: z.string(),
  sessionUserId: z.string(),
  paymentType: z.string().default("Hackfest"),
});

const verifyAndSavePaymentSchema = z.object({
  paymentName: z.string(),
  paymentType: z.string().default("Hackfest"),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  amount: z.number(),
  teamId: z.string(),
  sessionUserId: z.string(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyAndSavePaymentInput = z.infer<
  typeof verifyAndSavePaymentSchema
>;
