export type RoundType = "ROUND_1" | "ROUND_2";

export type SubmissionItem = {
  id: string;
  teamId: string;
  teamName: string;
  state: string | null;
  trackId: string;
  trackName: string;
  pdfUrl: string;
  createdAt: string;
  evaluatorScore: number | null;
};

export type SubmissionResponse = {
  submissions: SubmissionItem[];
  nextCursor: string | null;
  totalCount: number;
};

export type LeaderboardItem = {
  rank: number;
  teamId: string;
  teamName: string;
  collegeName: string | null;
  trackId: string;
  trackName: string;
  score: number;
  rawScore: number;
  averageScore: number;
  normalizedScore: number;
  evaluatorCount: number;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardItem[];
  nextCursor: string | null;
  totalCount: number;
};

export type TrackItem = {
  id: string;
  name: string;
};

export type IdeaRound = {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  targetStage: string;
  status: "Draft" | "Active" | "Completed";
  criteriaCount: number;
  assignmentCount: number;
};

export type IdeaCriterion = {
  id: string;
  name: string;
  maxScore: number;
};

export type IdeaAllocation = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamStage: string;
  roundId: string;
  roundName: string;
  roundStatus: "Draft" | "Active" | "Completed";
  pptUrl: string | null;
  trackName: string | null;
  scoredCriteria: number;
  totalCriteria: number;
  totalRawScore: number;
  totalMaxScore: number;
};
