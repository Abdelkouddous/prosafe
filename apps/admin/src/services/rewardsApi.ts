import api from "./api";

export type RewardPeriod = "month" | "year" | "all";

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  firstName: string;
  lastName: string;
  points: number;
  badge: string | null;
}

export const rewardsApi = {
  leaderboard: (period: RewardPeriod, limit = 20) =>
    api.get<LeaderboardEntry[]>("/rewards/leaderboard", {
      params: { period, limit },
    }),
};
