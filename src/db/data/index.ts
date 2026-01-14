import { teams, users } from "~/db/schema";
import { queryBuilder } from "./utils/builder";

export const query = {
  users: queryBuilder(users, "users"),
  teams: queryBuilder(teams, "teams"),
};
