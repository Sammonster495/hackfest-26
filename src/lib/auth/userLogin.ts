"use server";

import { signIn as github, signOut } from "~/auth/config";
import { signIn as google } from "~/auth/event-config";

export async function signInWithGitHub() {
  await github("github", { callbackUrl: "/teams" });
}

export async function signInWithGoogle() {
  await google("google", { callbackUrl: "/events" });
}

export async function signOutOfGitHub(redirectTo?: string) {
  await signOut({ redirect: false, redirectTo: redirectTo ?? "/" });
}

export async function signOutOfGoogle(redirectTo?: string) {
  const { signOut: googleSignOut } = await import("~/auth/event-config");
  await googleSignOut({ redirect: false, redirectTo: redirectTo ?? "/events" });
}
