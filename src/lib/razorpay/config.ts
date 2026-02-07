import Razorpay from "razorpay";
import { env } from "~/env";

export const razorPay = new Razorpay({
    key_id: env.RAZORPAY_API_KEY_ID,
    key_secret: env.RAZORPAY_SECRET,
});
