import { auth } from "./config";
import { auth as eventAuth } from "./event-config";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getCurrentEventUser() {
  const session = await eventAuth();
  return session?.eventUser ?? null;
}
