export enum MaintenanceType {
  INSPECTION = 'inspection',
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
}

export enum MaintenanceStatus {
  PLANNED = 'planned',
  DONE = 'done',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum MaintenanceResult {
  OK = 'ok',
  ISSUES = 'issues',
  FAILED = 'failed',
}
