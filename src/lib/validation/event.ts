import z from "zod";

export const eventSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10),
  date: z.date().optional(),
  venue: z.string().min(2).max(100),
  deadline: z.date().optional(),
  image: z.string(),
  type: z.enum(["Solo", "Team"]),
  status: z.enum(["Draft", "Published", "Ongoing", "Completed"]),
  maxTeams: z.number().min(0),
  minTeamSize: z.number().min(1),
  maxTeamSize: z.number().min(1),
});
