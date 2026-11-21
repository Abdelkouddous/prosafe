import api from "./api";

export interface RewardsSummary {
  totalPoints: number;
  rank: number | null;
  badge: { name?: string; label?: string; key?: string } | string | null;
  nextBadgeAt: number | null;
}

export const fetchRewardsSummary = async (): Promise<RewardsSummary> => {
  const res = await api.get("/rewards/me/summary");
  return res.data;
};
