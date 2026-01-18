import {
  dashboardUserRoles,
  dashboardUsers,
  participants,
  permissions,
  roles,
  teams,
} from "~/db/schema";
import { queryBuilder } from "./utils/builder";

export const query = {
  participants: queryBuilder(participants, "participants"),
  teams: queryBuilder(teams, "teams"),
  dashboardUsers: queryBuilder(dashboardUsers, "dashboardUsers"),
  roles: queryBuilder(roles, "roles"),
  permissions: queryBuilder(permissions, "permissions"),
  dashboardUserRoles: queryBuilder(dashboardUserRoles, "dashboardUserRoles"),
};
