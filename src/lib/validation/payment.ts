import { z } from "zod";

const createOrderSchema = z.object({
  amountInINR: z.number(),
  teamId: z.string(),
  sessionUserId: z.string(),
  paymentType: z.enum(["PARTICIPATION", "EVENT"]).default("PARTICIPATION"),
  eventId: z.string().optional(),
});

const verifyAndSavePaymentSchema = z.object({
  paymentName: z.string(),
  paymentType: z.enum(["PARTICIPATION", "EVENT"]).default("PARTICIPATION"),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  amount: z.number(),
  teamId: z.string(),
  sessionUserId: z.string(),
  eventId: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyAndSavePaymentInput = z.infer<
  typeof verifyAndSavePaymentSchema
>;
