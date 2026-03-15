export type RoundType = "ROUND_1" | "ROUND_2";

export type SubmissionItem = {
  id: string;
  teamId: string;
  teamName: string;
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

export type PdfWindow = {
  id: string;
  title: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};
