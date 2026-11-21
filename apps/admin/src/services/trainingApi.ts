import api from "./api";

export type TrainingRole = "admin" | "sst_manager" | "employee";
export type SessionStatus = "planned" | "ongoing" | "completed" | "cancelled";
export type EnrollmentStatus =
  | "registered"
  | "attended"
  | "passed"
  | "failed"
  | "cancelled";

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Training {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  durationHours?: number | null;
  validityMonths?: number | null;
  mandatoryForRoles: TrainingRole[];
  isActive: boolean;
}

export interface TrainingPayload {
  title: string;
  description?: string;
  category?: string;
  durationHours?: number;
  validityMonths?: number;
  mandatoryForRoles?: TrainingRole[];
  isActive?: boolean;
}

export interface TrainingSession {
  id: number;
  trainingId: number;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  trainer?: string | null;
  capacity?: number | null;
  status: SessionStatus;
  enrolledCount: number;
  training?: Training;
}

export interface SessionPayload {
  trainingId?: number;
  startAt?: string;
  endAt?: string;
  location?: string;
  trainer?: string;
  capacity?: number;
  status?: SessionStatus;
}

export interface Enrollment {
  id: number;
  sessionId: number;
  userId: number;
  status: EnrollmentStatus;
  score?: number | null;
  progress: number;
  completedAt?: string | null;
  expiresAt?: string | null;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    department?: string | null;
  };
}

export interface SkillItem {
  trainingId: number;
  title: string;
  expired?: boolean;
  expiresAt?: string | null;
}

export interface SkillsUser {
  userId: number;
  firstName: string;
  lastName: string;
  department?: string | null;
  acquired: SkillItem[];
  expiring: SkillItem[];
  missing: SkillItem[];
}

export interface SkillsReport {
  department: string | null;
  generatedAt: string;
  summary: {
    users: number;
    compliantUsers: number;
    complianceRate: number;
    acquired: number;
    expiring: number;
    missing: number;
  };
  users: SkillsUser[];
}

export interface AutoPlanResult {
  total: number;
  notified: number;
  dryRun: boolean;
  users: {
    userId: number;
    firstName: string;
    lastName: string;
    department?: string | null;
    missing: (SkillItem & {
      nextSession?: { id: number; startAt: string } | null;
    })[];
  }[];
}

const clean = (p: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== "" && v !== "all")
  );

export const trainingApi = {
  // Catalogue
  list: (params: { page?: number; limit?: number; search?: string; isActive?: boolean; category?: string } = {}) =>
    api.get<Paginated<Training>>("/trainings", { params: clean(params) }),
  create: (data: TrainingPayload) => api.post<Training>("/trainings", data),
  update: (id: number, data: Partial<TrainingPayload>) =>
    api.patch<Training>(`/trainings/${id}`, data),
  remove: (id: number) => api.delete(`/trainings/${id}`),

  // Sessions
  listSessions: (
    params: {
      trainingId?: number;
      status?: string;
      from?: string;
      to?: string;
      upcoming?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ) => api.get<Paginated<TrainingSession>>("/trainings/sessions", { params: clean(params) }),
  createSession: (data: SessionPayload) =>
    api.post<TrainingSession>("/trainings/sessions", data),
  updateSession: (id: number, data: SessionPayload) =>
    api.patch<TrainingSession>(`/trainings/sessions/${id}`, data),
  deleteSession: (id: number) => api.delete(`/trainings/sessions/${id}`),

  // Enrollments
  listEnrollments: (sessionId: number) =>
    api.get<Paginated<Enrollment>>(`/trainings/sessions/${sessionId}/enrollments`, {
      params: { limit: 100 },
    }),
  enroll: (sessionId: number, userId: number) =>
    api.post<Enrollment>(`/trainings/sessions/${sessionId}/enroll`, { userId }),
  unenroll: (sessionId: number, userId: number) =>
    api.delete(`/trainings/sessions/${sessionId}/enroll`, { params: { userId } }),
  updateEnrollment: (
    id: number,
    data: { status?: EnrollmentStatus; score?: number; progress?: number }
  ) => api.patch<Enrollment>(`/trainings/enrollments/${id}`, data),

  // Compliance
  skillsReport: (department?: string) =>
    api.get<SkillsReport>("/trainings/skills-report", {
      params: clean({ department }),
    }),
  autoPlan: (data: { department?: string; dryRun?: boolean }) =>
    api.post<AutoPlanResult>("/trainings/auto-plan", data),
};

// ----- Users (for enrollment picker) -----
export interface PickableUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string | null;
}

/**
 * GET /auth/users is admin-only and returns every user; keep approved ones.
 * SST managers get 403 there, so fall back to the users of the skills report.
 */
export async function fetchEnrollableUsers(): Promise<PickableUser[]> {
  try {
    const res = await api.get<
      (PickableUser & { roles?: string[]; isActive?: boolean })[]
    >("/auth/users");
    return res.data
      .filter((u) => !(u.roles || []).includes("pending") && u.isActive !== false)
      .map(({ id, firstName, lastName, email, department }) => ({
        id,
        firstName,
        lastName,
        email,
        department,
      }));
  } catch (e) {
    if ((e as { response?: { status?: number } })?.response?.status !== 403) throw e;
    const rep = await trainingApi.skillsReport();
    return rep.data.users.map((u) => ({
      id: u.userId,
      firstName: u.firstName,
      lastName: u.lastName,
      department: u.department,
    }));
  }
}

/** Minimal user shape used by adminApi. */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}
