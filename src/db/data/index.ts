import {
  dashboardUserRoles,
  dashboardUsers,
  eventParticipants,
  events,
  eventTeams,
  eventUsers,
  participants,
  permissions,
  roles,
  siteSettings,
  teams,
} from "~/db/schema";
import { queryBuilder } from "./utils/builder";

export const query = {
  participants: queryBuilder(participants, "participants"),
  teams: queryBuilder(teams, "teams"),
  dashboardUsers: queryBuilder(dashboardUsers, "dashboardUsers"),
  roles: queryBuilder(roles, "roles"),
  events: queryBuilder(events, "events"),
  eventParticipants: queryBuilder(eventParticipants, "eventParticipants"),
  eventTeams: queryBuilder(eventTeams, "eventTeams"),
  permissions: queryBuilder(permissions, "permissions"),
  dashboardUserRoles: queryBuilder(dashboardUserRoles, "dashboardUserRoles"),
  siteSettings: queryBuilder(siteSettings, "siteSettings"),
  eventUsers: queryBuilder(eventUsers, "eventUsers"),
};
