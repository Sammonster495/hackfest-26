import "dotenv/config";
import { z } from "zod";

const server = z.object({
  DATABASE_URL: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

const client = z.object({
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
};

function validateEnv() {
  const serverParsed = server.safeParse(processEnv);
  const clientParsed = client.safeParse(processEnv);

  if (!serverParsed.success) {
    const errorMessage = [
      "\n❌ Invalid server environment variables:\n",
      JSON.stringify(z.treeifyError(serverParsed.error), null, 2),
      "\n❌ Missing or invalid environment variables detected.",
      "Please check your .env file and ensure all required variables are set.\n",
    ].join("\n");

    console.error(errorMessage);

    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    }

    throw new Error(errorMessage);
  }

  if (!clientParsed.success) {
    const errorMessage = [
      "\n❌ Invalid client environment variables:\n",
      JSON.stringify(z.treeifyError(clientParsed.error), null, 2),
      "\n❌ Missing or invalid environment variables detected.",
      "Please check your .env file and ensure all required variables are set.\n",
    ].join("\n");

    console.error(errorMessage);

    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    }

    throw new Error(errorMessage);
  }

  return {
    ...serverParsed.data,
    ...clientParsed.data,
  };
}

export const env = validateEnv();

