import { AppError } from "~/lib/errors/app-error";
import { count, countDistinct, desc, eq, isNotNull } from "drizzle-orm";
import db from "..";
import { colleges, participants, teams } from "../schema";
import { ideaSubmission } from "../schema/ideaSubmission";

export async function getDashboardStats() {
    try {
        const [teamsResult] = await db.select({ count: count() }).from(teams);
        const totalTeams = teamsResult?.count ?? 0;

        const [participantsResult] = await db
            .select({ count: count() })
            .from(participants)
            .where(isNotNull(participants.teamId));
        const totalParticipants = participantsResult?.count ?? 0;

        const [collegesResult] = await db
            .select({ count: countDistinct(participants.collegeId) })
            .from(participants)
            .where(isNotNull(participants.teamId));
        const uniqueColleges = collegesResult?.count ?? 0;

        const [statesResult] = await db
            .select({ count: countDistinct(colleges.state) })
            .from(colleges)
            .innerJoin(participants, eq(colleges.id, participants.collegeId))
            .innerJoin(teams, eq(participants.teamId, teams.id))
            .where(eq(teams.isCompleted, true));
        const uniqueStates = statesResult?.count ?? 0;

        const [confirmedTeamsResult] = await db.select({ count: count() }).from(teams).where(eq(teams.isCompleted, true));
        const confirmedTeams = confirmedTeamsResult?.count ?? 0;

        const [ideaSubmissionsResult] = await db.select({ count: count() }).from(ideaSubmission);
        const ideaSubmissions = ideaSubmissionsResult?.count ?? 0;

        return {
            totalTeams,
            totalParticipants,
            uniqueColleges,
            uniqueStates,
            confirmedTeams,
            ideaSubmissions,
        };
    } catch (error) {
        console.log(error);
        throw new AppError("QUICK_STATS_FETCH_FAILED", 500);
    }
}

export async function getStatesStats() {
    try {
        const statesStatsResult = await db.select({
            state: colleges.state,
            totalTeams: count(teams.id),
            totalParticipants: count(participants.id),
        }).from(colleges)
            .innerJoin(participants, eq(colleges.id, participants.collegeId))
            .innerJoin(teams, eq(participants.teamId, teams.id))
            .where(eq(teams.isCompleted, true))
            .groupBy(colleges.state)
            .orderBy(desc(count(teams.id)));

        return statesStatsResult;
    } catch (error) {
        console.log(error);
        throw new AppError("STATES_STATS_FETCH_FAILED", 500);
    }
}

export async function getCollegeRankingsBySelections() {
    try {
        const collegeRankingsResult = await db.select({
            college: colleges.name,
            totalTeams: count(teams.id),
            totalParticipants: count(participants.id),
        }).from(colleges)
            .innerJoin(participants, eq(colleges.id, participants.collegeId))
            .innerJoin(teams, eq(participants.teamId, teams.id))
            .where(eq(teams.teamProgress, "SELECTED"))
            .groupBy(colleges.name)
            .orderBy(desc(count(teams.id)));

        return collegeRankingsResult;
    } catch (error) {
        console.log(error);
        throw new AppError("COLLEGE_RANKINGS_FETCH_FAILED", 500);
    }
}