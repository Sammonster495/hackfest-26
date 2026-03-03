"use server";

import { signIn as github } from "~/auth/config";
import { signIn as google } from "~/auth/event-config";

export async function signInWithGitHub() {
  await github("github", { callbackUrl: "/teams" });
}

export async function signInWithGoogle() {
  await google("google", { callbackUrl: "/events" });
}
