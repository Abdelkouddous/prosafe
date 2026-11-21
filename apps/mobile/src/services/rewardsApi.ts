import api from "./api";

export type BadgeKey = "bronze" | "silver" | "gold" | "platinum";
export type LeaderboardPeriod = "month" | "year" | "all";

export interface RewardsSummary {
  totalPoints: number;
  rank: number | null;
  badge: BadgeKey | null;
  nextBadgeAt: number | null;
}

export interface RewardEntry {
  id: number;
  incidentId?: string | null;
  points: number;
  reason?: string | null;
  created_at: string;
}

export interface LeaderboardRow {
  rank: number;
  userId: number;
  firstName: string;
  lastName: string;
  points: number;
  badge: BadgeKey | null;
}

/** Badge thresholds (total points), mirrors the backend. */
export const BADGE_THRESHOLDS: Record<BadgeKey, number> = {
  bronze: 20,
  silver: 50,
  gold: 100,
  platinum: 200,
};

export const fetchRewardsSummary = async (): Promise<RewardsSummary> => {
  const res = await api.get("/rewards/me/summary");
  return res.data;
};

export const fetchMyRewards = async (): Promise<RewardEntry[]> => {
  const res = await api.get("/rewards/me");
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
};

export const fetchLeaderboard = async (
  period: LeaderboardPeriod,
  limit = 10
): Promise<LeaderboardRow[]> => {
  const res = await api.get("/rewards/leaderboard", { params: { period, limit } });
  return res.data;
};
