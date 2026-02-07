import Razorpay from "razorpay";
import { env } from "~/env";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayInstance) {
    if (!env.RAZORPAY_API_KEY_ID || !env.RAZORPAY_SECRET) {
      throw new Error("Razorpay credentials are not configured");
    }
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_API_KEY_ID,
      key_secret: env.RAZORPAY_SECRET,
    });
  }
  return razorpayInstance;
}
