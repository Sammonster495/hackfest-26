import { parseBody } from "~/lib/validation/parse";
import {
  createTeamSchema,
  type UpdateTeamInput,
  updateTeamSchema,
} from "~/lib/validation/team";
import { query } from "./index";

export async function findById(id: string) {
  return query.teams.findOne({
    where: (t, { eq }) => eq(t.id, id),
  });
}

export async function findByName(name: string) {
  return query.teams.findOne({
    where: (t, { eq }) => eq(t.name, name),
  });
}

export async function listTeams() {
  return query.teams.findMany({});
}

export async function updateTeam(id: string, data: UpdateTeamInput) {
  const payload = updateTeamSchema.parse(data);
  return query.teams.update(id, payload);
}

export async function deleteTeam(id: string) {
  return query.teams.delete(id);
}

export async function createTeam(data: unknown) {
  const payload = parseBody(createTeamSchema, data);

  return query.teams.insert(payload);
}

export async function listMembers(teamId: string) {
  return query.participants.findMany({
    where: (u, { eq }) => eq(u.teamId, teamId),
  });
}
