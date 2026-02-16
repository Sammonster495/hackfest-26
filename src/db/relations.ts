// Write relations here
// Why relations? Gives type safety eg .with joins

import { relations } from "drizzle-orm";
import {
  colleges,
  dashboardUserRoles,
  dashboardUsers,
  eventAccounts,
  eventOrganizers,
  eventParticipants,
  eventSessions,
  events,
  eventTeams,
  eventUsers,
  ideaSubmission,
  participants,
  payment,
  permissions,
  rolePermissions,
  roles,
  teams,
  tracks,
} from "./schema";
import { notSelected, selected, semiSelected } from "./schema/team-progress";

export const userRelations = relations(participants, ({ one, many }) => ({
  college: one(colleges, {
    fields: [participants.collegeId],
    references: [colleges.id],
  }),
  team: one(teams, {
    fields: [participants.teamId],
    references: [teams.id],
  }),
  payments: many(payment),
}));

export const collegeRelations = relations(colleges, ({ many }) => ({
  users: many(participants),
  eventUsers: many(eventUsers),
}));

export const teamRelations = relations(teams, ({ many, one }) => ({
  users: many(participants),
  submission: one(ideaSubmission),
  payments: many(payment),
  leader: one(participants, {
    fields: [teams.leaderId],
    references: [participants.id],
  }),
  notSelected: one(notSelected, {
    fields: [teams.id],
    references: [notSelected.teamId],
  }),
  semiSelected: one(semiSelected, {
    fields: [teams.id],
    references: [semiSelected.teamId],
  }),
  selected: one(selected, {
    fields: [teams.id],
    references: [selected.teamId],
  }),
  ideaSubmission: one(ideaSubmission, {
    fields: [teams.id],
    references: [ideaSubmission.teamId],
  }),
}));

export const notSelectedRelations = relations(notSelected, ({ one }) => ({
  team: one(teams, {
    fields: [notSelected.teamId],
    references: [teams.id],
  }),
}));

export const semiSelectedRelations = relations(semiSelected, ({ one }) => ({
  team: one(teams, {
    fields: [semiSelected.teamId],
    references: [teams.id],
  }),
}));

export const selectedRelations = relations(selected, ({ one }) => ({
  team: one(teams, {
    fields: [selected.teamId],
    references: [teams.id],
  }),
}));

export const trackRelations = relations(tracks, ({ many }) => ({
  submissions: many(ideaSubmission),
}));

export const ideaSubmissionRelations = relations(ideaSubmission, ({ one }) => ({
  track: one(tracks, {
    fields: [ideaSubmission.trackId],
    references: [tracks.id],
  }),
  team: one(teams, {
    fields: [ideaSubmission.teamId],
    references: [teams.id],
  }),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  user: one(participants, {
    fields: [payment.userId],
    references: [participants.id],
  }),
  team: one(teams, {
    fields: [payment.teamId],
    references: [teams.id],
  }),
  eventUser: one(eventParticipants, {
    fields: [payment.eventUserId],
    references: [eventParticipants.id],
  }),
  eventTeam: one(eventTeams, {
    fields: [payment.eventTeamId],
    references: [eventTeams.id],
  }),
}));

export const dashboardUserRelations = relations(dashboardUsers, ({ many }) => ({
  roles: many(dashboardUserRoles),
  eventOrganizers: many(eventOrganizers),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  dashboardUsers: many(dashboardUserRoles),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const dashboardUserRoleRelations = relations(
  dashboardUserRoles,
  ({ one }) => ({
    dashboardUser: one(dashboardUsers, {
      fields: [dashboardUserRoles.dashboardUserId],
      references: [dashboardUsers.id],
    }),
    role: one(roles, {
      fields: [dashboardUserRoles.roleId],
      references: [roles.id],
    }),
  }),
);

export const eventTeamRelations = relations(eventTeams, ({ many, one }) => ({
  event: one(events, {
    fields: [eventTeams.eventId],
    references: [events.id],
  }),
  members: many(eventParticipants),
  payments: many(payment),
}));

export const eventUserRelations = relations(eventUsers, ({ many, one }) => ({
  college: one(colleges, {
    fields: [eventUsers.collegeId],
    references: [colleges.id],
  }),
  participants: many(eventParticipants),
  accounts: many(eventAccounts),
  sessions: many(eventSessions),
}));

export const eventRelations = relations(events, ({ many }) => ({
  teams: many(eventTeams),
  organizers: many(eventOrganizers),
  participants: many(eventParticipants),
}));

export const eventParticipantRelations = relations(
  eventParticipants,
  ({ one, many }) => ({
    user: one(eventUsers, {
      fields: [eventParticipants.userId],
      references: [eventUsers.id],
    }),
    team: one(eventTeams, {
      fields: [eventParticipants.teamId],
      references: [eventTeams.id],
    }),
    event: one(events, {
      fields: [eventParticipants.eventId],
      references: [events.id],
    }),
    payments: many(payment),
  }),
);
