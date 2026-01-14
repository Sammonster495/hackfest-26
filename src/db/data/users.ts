import { query } from "~/db/data";
import { parseBody } from "~/lib/validation/parse";
import {
  type RegisterUserInput,
  registerUserSchema,
  type UpdateUserInput,
  updateUserSchema,
} from "~/lib/validation/user";

export async function findById(id: string) {
  return query.users.findOne({
    where: (u, { eq }) => eq(u.id, id),
  });
}

export async function findByEmail(email: string) {
  return query.users.findOne({
    where: (u, { eq }) => eq(u.email, email),
  });
}

export async function listUsers() {
  return query.users.findMany({});
}

export async function createUser(
  data: RegisterUserInput & { email: string; image?: string | null },
) {
  const payload = parseBody(registerUserSchema, data);
  return query.users.insert({
    ...payload,
    email: data.email,
    image: data.image || null,
  });
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const payload = updateUserSchema.parse(data);
  return query.users.update(id, payload);
}
