import { query } from "~/db/data";
import { parseBody } from "~/lib/validation/parse";
import {
  type RegisterParticipantInput,
  registerParticipantSchema,
  type UpdateParticipantInput,
  updateParticipantSchema,
} from "~/lib/validation/participant";

export async function findById(id: string) {
  return query.participants.findOne({
    where: (u, { eq }) => eq(u.id, id),
  });
}

export async function findByEmail(email: string) {
  return query.participants.findOne({
    where: (u, { eq }) => eq(u.email, email),
  });
}

export async function listUsers() {
  return query.participants.findMany({});
}

export async function createUser(
  data: RegisterParticipantInput & { email: string; image?: string | null },
) {
  const payload = parseBody(registerParticipantSchema, data);
  return query.participants.insert({
    ...payload,
    email: data.email,
    image: data.image || null,
  });
}

export async function updateUser(id: string, data: UpdateParticipantInput) {
  const payload = updateParticipantSchema.parse(data);
  return query.participants.update(id, payload);
}
