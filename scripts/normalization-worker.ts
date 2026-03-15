import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { recomputeNormalizedScores } from "../src/db/services/evaluation-services";
import { recalculateNormalizedScores } from "../src/db/services/judge-services";
import {
  EVALUATION_NORMALIZE_JOB_NAME,
  JUDGE_NORMALIZE_JOB_NAME,
  QUEUE_NAME,
} from "../src/lib/queue/normalization";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required");
  process.exit(1);
}

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name === JUDGE_NORMALIZE_JOB_NAME) {
      const { judgeId, judgeRoundId } = job.data as {
        judgeId: string;
        judgeRoundId: string;
      };

      console.log(
        `[normalization] Processing judge scores: judge=${judgeId} round=${judgeRoundId}`,
      );

      await recalculateNormalizedScores(judgeId, judgeRoundId);

      console.log(
        `[normalization] Done judge scores: judge=${judgeId} round=${judgeRoundId}`,
      );
      return;
    }

    if (job.name === EVALUATION_NORMALIZE_JOB_NAME) {
      const { roundId } = job.data as { roundId: string };

      console.log(
        `[normalization] Processing evaluation scores: round=${roundId}`,
      );

      await recomputeNormalizedScores(roundId);

      console.log(`[normalization] Done evaluation scores: round=${roundId}`);
      return;
    }

    throw new Error(`Unknown normalization job: ${job.name}`);
  },
  {
    connection,
    concurrency: 5,
  },
);

worker.on("failed", (job, err) => {
  console.error(`[normalization] Job ${job?.id} failed:`, err.message);
});

worker.on("ready", () => {
  console.log("[normalization] Worker ready and listening for jobs...");
});

process.on("SIGINT", async () => {
  console.log("[normalization] Shutting down...");
  await worker.close();
  process.exit(0);
});
