import api from "./api";

export type ActionSource = "incident" | "risk" | "audit";
export type ActionStatus = "todo" | "in_progress" | "done" | "cancelled";

export const ACTION_STATUSES: ActionStatus[] = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

export interface CorrectiveAction {
  id: number;
  sourceType: ActionSource;
  sourceId: number;
  title: string;
  description?: string | null;
  ownerId?: number | null;
  owner?: { id: number; firstName: string; lastName: string } | null;
  dueDate?: string | null;
  status: ActionStatus;
  doneAt?: string | null;
  createdAt: string;
}

export interface ActionInput {
  sourceType: ActionSource;
  sourceId: number;
  title: string;
  description?: string;
  ownerId?: number;
  dueDate?: string;
}

export const isOverdue = (a: Pick<CorrectiveAction, "dueDate" | "status">) =>
  !!a.dueDate &&
  (a.status === "todo" || a.status === "in_progress") &&
  new Date(a.dueDate).getTime() < Date.now();

export const correctiveActionApi = {
  list: (
    p: {
      sourceType?: string;
      sourceId?: number;
      status?: string;
      ownerId?: number;
      page?: number;
      limit?: number;
    } = {}
  ) =>
    api.get<{ data: CorrectiveAction[]; total: number; page: number; limit: number }>(
      "/corrective-actions",
      {
        params: Object.fromEntries(
          Object.entries(p).filter(([, v]) => v !== undefined && v !== "")
        ),
      }
    ),
  create: (d: ActionInput) => api.post<CorrectiveAction>("/corrective-actions", d),
  update: (id: number, d: Partial<Omit<ActionInput, "sourceType" | "sourceId">> & { status?: ActionStatus }) =>
    api.patch<CorrectiveAction>(`/corrective-actions/${id}`, d),
  remove: (id: number) => api.delete(`/corrective-actions/${id}`),
};
