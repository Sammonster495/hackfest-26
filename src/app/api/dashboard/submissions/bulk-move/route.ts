import { z } from "zod";

// import { bulkPromoteSubmissions } from "~/db/services/submission-services";

const _bulkMoveSchema = z.object({
  teamIds: z.array(z.string().min(1)).min(1),
  nextStage: z.enum(["NOT_SELECTED", "SEMI_SELECTED", "SELECTED"]),
});

// export const POST = adminProtected(async (request, _ctx, user) => {
//   try {
//     const body = await request.json();
//     const parsed = bulkMoveSchema.parse(body);
//     const result = await bulkPromoteSubmissions(
//       parsed.teamIds,
//       parsed.nextStage,
//       user,
//     );

//     return NextResponse.json({
//       message: `Teams successfully moved to ${parsed.nextStage.replace("_", " ")}`,
//       movedCount: result.movedCount,
//     });
//   } catch (error) {
//     return errorResponse(error);
//   }
// });
