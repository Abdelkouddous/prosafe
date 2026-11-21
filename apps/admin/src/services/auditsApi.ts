import api from "./api";
import { cleanParams, type Paginated } from "@/lib/params";
import type { CorrectiveAction } from "./correctiveActionApi";

export type AuditType = "internal" | "external";
export type AuditStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type AuditResult = "conform" | "non_conform" | "not_applicable";
export const AUDIT_STATUSES: AuditStatus[] = ["planned", "in_progress", "completed", "cancelled"];
export const AUDIT_RESULTS: AuditResult[] = ["conform", "non_conform", "not_applicable"];

export interface Audit {
  id: number;
  title: string;
  type: AuditType;
  standard?: string | null;
  scheduledAt: string;
  completedAt?: string | null;
  auditorName?: string | null;
  auditorId?: number | null;
  auditor?: { id: number; firstName: string; lastName: string } | null;
  zone?: string | null;
  status: AuditStatus;
  score?: number | null;
  templateId?: number | null;
}

export interface ChecklistItem {
  id: number;
  clause: string;
  question: string;
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  standard: string;
  items: ChecklistItem[];
}

export interface AuditResponse {
  itemId: number;
  result: AuditResult;
  comment?: string | null;
  evidenceFileId?: number | null;
  correctiveActionId?: number | null;
}

export interface AuditSummary {
  conform: number;
  nonConform: number;
  notApplicable: number;
  unanswered: number;
  score: number | null;
}

export interface AuditDetail extends Audit {
  template: ChecklistTemplate | null;
  responses: AuditResponse[];
  summary: AuditSummary;
  correctiveActions: CorrectiveAction[];
}

export interface AuditInput {
  title?: string;
  type?: AuditType;
  standard?: string;
  scheduledAt?: string;
  auditorName?: string;
  auditorId?: number;
  zone?: string;
  templateId?: number;
  status?: AuditStatus;
}

export interface SaveResponsesInput {
  responses: { itemId: number; result: AuditResult; comment?: string }[];
  createActions?: boolean;
  actionOwnerId?: number;
  actionDueDate?: string;
}

export type DocType = "audit_report" | "certificate" | "procedure" | "policy" | "other";
export const DOC_TYPES: DocType[] = ["audit_report", "certificate", "procedure", "policy", "other"];

export interface ComplianceDocument {
  id: number;
  title: string;
  type: DocType;
  fileId: number;
  file?: { id: number; originalName: string; mimeType: string; size: number } | null;
  validUntil?: string | null;
  auditId?: number | null;
  createdAt: string;
}

export const auditsApi = {
  list: (f: { from?: string; to?: string; status?: string; type?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Audit>>("/audits", { params: cleanParams({ limit: 100, ...f }) }),
  get: (id: number) => api.get<AuditDetail>(`/audits/${id}`),
  create: (d: AuditInput) => api.post<Audit>("/audits", d),
  update: (id: number, d: AuditInput) => api.patch<Audit>(`/audits/${id}`, d),
  remove: (id: number) => api.delete(`/audits/${id}`),
  templates: () => api.get<ChecklistTemplate[]>("/audits/templates"),
  saveResponses: (id: number, d: SaveResponsesInput) => api.put<AuditDetail>(`/audits/${id}/responses`, d),

  listDocs: (f: { type?: string; expiring?: boolean; search?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<ComplianceDocument>>("/compliance-documents", {
      params: cleanParams({ limit: 20, ...f }),
    }),
  uploadDoc: (d: { title: string; type: DocType; validUntil?: string; file: File }) => {
    const fd = new FormData();
    fd.append("file", d.file);
    fd.append("title", d.title);
    fd.append("type", d.type);
    if (d.validUntil) fd.append("validUntil", d.validUntil);
    return api.post<ComplianceDocument>("/compliance-documents", fd, { timeout: 120000 });
  },
  removeDoc: (id: number) => api.delete(`/compliance-documents/${id}`),
};
