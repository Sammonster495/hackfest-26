// Write relations here
// Why relations? Gives type safety eg .with joins

import { relations } from "drizzle-orm";
import {
  colleges,
  dashboardUserRoles,
  dashboardUsers,
  eventOrganizers,
  eventParticipants,
  events,
  eventTeams,
  ideaSubmission,
  participants,
  payment,
  permissions,
  rolePermissions,
  roles,
  teams,
  tracks,
} from "./schema";
import {
  mentorFeedback,
  mentorRoundAssignments,
  mentorRounds,
  mentors,
} from "./schema/mentor";
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
}));

export const teamRelations = relations(teams, ({ many, one }) => ({
  users: many(participants),
  submission: one(ideaSubmission),
  payment: one(payment, {
    fields: [teams.paymentId],
    references: [payment.id],
  }),
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
  mentorAssignments: many(mentorRoundAssignments),
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
  team: one(teams),
  eventUser: one(eventParticipants),
  eventTeam: one(eventTeams),
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

export const eventOrganizerRelations = relations(
  eventOrganizers,
  ({ one }) => ({
    user: one(dashboardUsers, {
      fields: [eventOrganizers.organizerId],
      references: [dashboardUsers.id],
    }),
    event: one(events, {
      fields: [eventOrganizers.eventId],
      references: [events.id],
    }),
  }),
);

export const eventTeamRelations = relations(eventTeams, ({ many, one }) => ({
  event: one(events, {
    fields: [eventTeams.eventId],
    references: [events.id],
  }),
  members: many(eventParticipants),
  payment: one(payment, {
    fields: [eventTeams.paymentId],
    references: [payment.id],
  }),
}));

export const eventRelations = relations(events, ({ many }) => ({
  teams: many(eventTeams),
  organizers: many(eventOrganizers),
  participants: many(eventParticipants),
}));

export const eventParticipantRelations = relations(
  eventParticipants,
  ({ one }) => ({
    user: one(participants, {
      fields: [eventParticipants.userId],
      references: [participants.id],
    }),
    team: one(eventTeams, {
      fields: [eventParticipants.teamId],
      references: [eventTeams.id],
    }),
    event: one(events, {
      fields: [eventParticipants.eventId],
      references: [events.id],
    }),
  }),
);

export const mentorRelations = relations(mentors, ({ one, many }) => ({
  dashboardUser: one(dashboardUsers, {
    fields: [mentors.dashboardUserId],
    references: [dashboardUsers.id],
  }),
  assignments: many(mentorRoundAssignments),
}));

export const mentorRoundRelations = relations(mentorRounds, ({ many }) => ({
  assignments: many(mentorRoundAssignments),
}));

export const mentorRoundAssignmentRelations = relations(
  mentorRoundAssignments,
  ({ one, many }) => ({
    mentor: one(mentors, {
      fields: [mentorRoundAssignments.mentorId],
      references: [mentors.id],
    }),
    team: one(teams, {
      fields: [mentorRoundAssignments.teamId],
      references: [teams.id],
    }),
    mentorRound: one(mentorRounds, {
      fields: [mentorRoundAssignments.mentorRoundId],
      references: [mentorRounds.id],
    }),
    feedbacks: many(mentorFeedback),
  }),
);

export const mentorFeedbackRelations = relations(mentorFeedback, ({ one }) => ({
  assignment: one(mentorRoundAssignments, {
    fields: [mentorFeedback.roundAssignmentId],
    references: [mentorRoundAssignments.id],
  }),
}));
