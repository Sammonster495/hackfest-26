import * as userData from "~/db/data/users";
import { AppError } from "~/lib/errors/app-error";
import { UpdateUserInput } from "~/lib/validation/user";

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

export async function updateUserProfile(userId: string, data: UpdateUserInput) {
  const user = await userData.findById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", 404);

  return userData.updateUser(userId, data);
}
