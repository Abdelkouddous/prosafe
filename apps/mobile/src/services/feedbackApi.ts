import api from "./api";

export const FEEDBACK_CATEGORIES = ["bug", "suggestion", "usability", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const sendFeedback = async (input: {
  rating: number;
  category: FeedbackCategory;
  comment: string;
  appVersion?: string;
  platform?: string;
}) => (await api.post("/feedback", input)).data;
