import { z } from "zod";
import { permissionProtected } from "~/auth/routes-wrapper";
import { markTeamAttendanceByScan } from "~/db/services/manage-event";

const scanSchema = z.object({
    teamId: z.string().min(1, "Team ID is required"),
    presentParticipantIds: z.array(z.string()).optional(),
});

export const POST = permissionProtected(
    ["event:manage"],
    async (req: Request) => {
        const body = await req.json();
        const parsed = scanSchema.safeParse(body);

        if (!parsed.success) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid input",
                    toast: true,
                    toastType: "error",
                    title: "Invalid Input",
                    description: parsed.error.issues
                        .map((issue) => issue.message)
                        .join(", "),
                },
                { status: 400 },
            );
        }

        return markTeamAttendanceByScan(
            parsed.data.teamId,
            parsed.data.presentParticipantIds,
        );
    },
);
