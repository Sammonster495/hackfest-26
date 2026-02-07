import crypto from "node:crypto";

export const verifyRazorpaySignature = (
  body: string,
  signature: string | null,
  secret: string,
): boolean => {
  if (!signature) {
    console.error("No signature provided for Razorpay webhook");
    return false;
  }
  console.log("Given signature: ", signature);
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  console.log("Expected Signature:", expectedSignature);

  return expectedSignature === signature;
};
