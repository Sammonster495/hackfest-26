import { z } from "zod";
import { paymentStatusEnum, teamStatusEnum } from "~/db/enum";

export const teamSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  teamNumber: z.number().int().positive().nullable(),
  teamStatus: z.enum(teamStatusEnum.enumValues).nullable(),
  paymentStatus: z.enum(paymentStatusEnum.enumValues).nullable(),
  attended: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const createTeamSchema = teamSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    attended: true,
    isCompleted: true,
    teamNumber: true,
    teamStatus: true,
    paymentStatus: true,
  });

export const updateTeamSchema = teamSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
