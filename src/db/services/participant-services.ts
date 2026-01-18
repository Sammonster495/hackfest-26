import * as userData from "~/db/data/participant";
import { AppError } from "~/lib/errors/app-error";
import type { UpdateParticipantInput } from "~/lib/validation/participant";

export async function getUserProfile(userId: string) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);
  return user;
}

export async function getUserByEmail(email: string) {
  const user = await userData.findByEmail(email);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);
  return user;
}

export async function listUsers() {
  return userData.listUsers();
}

export async function updateUserProfile(
  userId: string,
  data: UpdateParticipantInput,
) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  return userData.updateUser(userId, data);
}
