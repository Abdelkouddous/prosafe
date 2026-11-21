import api from "./api";

export interface Training {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  durationHours: number | null;
  validityMonths: number | null;
  mandatoryForRoles: string[];
  isActive: boolean;
}

export interface TrainingSession {
  id: number;
  trainingId: number;
  startAt: string;
  endAt: string | null;
  location: string | null;
  trainer: string | null;
  capacity: number | null;
  status: string;
  enrolledCount: number;
  enrolledByMe: boolean;
  training?: Training;
}

export interface MyEnrollment {
  id: number;
  status: "registered" | "attended" | "passed" | "failed" | "cancelled";
  score: number | null;
  progress: number;
  completedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  expiresSoon: boolean;
  session?: {
    startAt: string;
    location: string | null;
    trainer: string | null;
    status: string;
    training?: {
      title: string;
      category: string | null;
      durationHours: number | null;
      validityMonths: number | null;
    };
  };
}

const list = <T,>(body: any): T[] =>
  Array.isArray(body) ? body : (body?.data ?? body?.items ?? []);

export const fetchTrainingCatalogue = async (): Promise<Training[]> =>
  list<Training>((await api.get("/trainings")).data);

export const fetchUpcomingSessions = async (): Promise<TrainingSession[]> =>
  list<TrainingSession>(
    (await api.get("/trainings/sessions", { params: { upcoming: true } })).data
  );

export const fetchMyTrainings = async (): Promise<MyEnrollment[]> =>
  list<MyEnrollment>((await api.get("/trainings/me")).data);

export const enrollInSession = async (sessionId: number) =>
  (await api.post(`/trainings/sessions/${sessionId}/enroll`)).data;

export const cancelEnrollment = async (sessionId: number) =>
  (await api.delete(`/trainings/sessions/${sessionId}/enroll`)).data;
