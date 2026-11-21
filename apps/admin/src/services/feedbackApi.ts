import api from "./api";
import { cleanParams, type Paginated } from "@/lib/params";

export type FeedbackCategory = "bug" | "suggestion" | "usability" | "other";
export const FEEDBACK_CATEGORIES: FeedbackCategory[] = ["bug", "suggestion", "usability", "other"];

export interface Feedback {
  id: number;
  rating: number;
  category: FeedbackCategory;
  comment?: string | null;
  appVersion?: string | null;
  platform?: string | null;
  user?: { id: number; firstName: string; lastName: string } | null;
  createdAt: string;
}

export const feedbackApi = {
  list: (f: { category?: string; rating?: number; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Feedback> & { averageRating: number | null }>("/feedback", {
      params: cleanParams({ limit: 20, ...f }),
    }),
};
