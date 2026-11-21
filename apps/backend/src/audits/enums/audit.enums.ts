export enum AuditType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum AuditStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AuditResult {
  CONFORM = 'conform',
  NON_CONFORM = 'non_conform',
  NOT_APPLICABLE = 'not_applicable',
}

export enum ComplianceDocumentType {
  AUDIT_REPORT = 'audit_report',
  CERTIFICATE = 'certificate',
  PROCEDURE = 'procedure',
  POLICY = 'policy',
  OTHER = 'other',
}
