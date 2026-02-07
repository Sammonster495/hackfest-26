import "dotenv/config";
import { z } from "zod";

const server = z.object({
  DATABASE_URL: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  MIXPANEL_TOKEN: z.string().min(1),
  HACKFEST_AMOUNT: z.string().min(1),
  RAZORPAY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  RAZORPAY_API_KEY_ID: z.string().min(1),
});

const client = z.object({
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_API_KEY_ID: z.string().min(1),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN,
  HACKFEST_AMOUNT: process.env.HACKFEST_AMOUNT,
  RAZORPAY_SECRET: process.env.RAZORPAY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_API_KEY_ID: process.env.RAZORPAY_API_KEY_ID,
  NEXT_PUBLIC_RAZORPAY_API_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY_ID,
};

function validateEnv() {
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.CI === "true" && !process.env.DATABASE_URL);

  const serverParsed = server.safeParse(processEnv);
  const clientParsed = client.safeParse(processEnv);

  // Client env vars are ALWAYS needed (including at build time for Next.js)
  if (!clientParsed.success) {
    const errorMessage = [
      "\n❌ Invalid client environment variables:\n",
      JSON.stringify(z.treeifyError(clientParsed.error), null, 2),
      "\n❌ Missing or invalid environment variables detected.",
      "Please check your .env file and ensure all required variables are set.\n",
    ].join("\n");

    console.error(errorMessage);

    if (typeof process !== "undefined" && process.exit) {
      try {
        process.exit(1);
      } catch { }
    }

    throw new Error(errorMessage);
  }

  // Server env vars are only needed at runtime, not during build
  if (!serverParsed.success && !isBuildTime) {
    const errorMessage = [
      "\n❌ Invalid server environment variables:\n",
      JSON.stringify(z.treeifyError(serverParsed.error), null, 2),
      "\n❌ Missing or invalid environment variables detected.",
      "Please check your .env file and ensure all required variables are set.\n",
    ].join("\n");

    console.error(errorMessage);

    if (typeof process !== "undefined" && process.exit) {
      try {
        process.exit(1);
      } catch { }
    }

    throw new Error(errorMessage);
  }

  // During build, return partial env with defaults for server vars
  if (isBuildTime && !serverParsed.success) {
    return {
      DATABASE_URL: "",
      GITHUB_CLIENT_ID: "",
      GITHUB_CLIENT_SECRET: "",
      MIXPANEL_TOKEN: "",
      HACKFEST_AMOUNT: 350,
      RAZORPAY_SECRET: "",
      RAZORPAY_WEBHOOK_SECRET: "",
      RAZORPAY_API_KEY_ID: "",
      ...clientParsed.data,
    };
  }

  return {
    ...serverParsed.data,
    ...clientParsed.data,
  };
}

export const env = validateEnv();
