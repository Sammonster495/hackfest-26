import { Queue } from "bullmq";
import { getRedisClient } from "~/lib/redis";

const QUEUE_NAME = "score-normalization";
const JUDGE_NORMALIZE_JOB_NAME = "normalize-scores";
const EVALUATION_NORMALIZE_JOB_NAME = "normalize-evaluation-scores";

let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: getRedisClient() });
  }
  return queue;
}

export async function addNormalizationJob(
  judgeId: string,
  judgeRoundId: string,
) {
  const jobId = `normalize-${judgeId}-${judgeRoundId}`;

  await getQueue().add(
    JUDGE_NORMALIZE_JOB_NAME,
    { judgeId, judgeRoundId },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  );
}

export async function addEvaluationNormalizationJob(roundId: string) {
  const jobId = `normalize-evaluation-${roundId}`;

  await getQueue().add(
    EVALUATION_NORMALIZE_JOB_NAME,
    { roundId },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  );
}

export { EVALUATION_NORMALIZE_JOB_NAME, JUDGE_NORMALIZE_JOB_NAME, QUEUE_NAME };
