export enum RiskStatus {
  PROPOSED = 'proposed',
  VALIDATED = 'validated',
  MITIGATED = 'mitigated',
  ARCHIVED = 'archived',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ActionPlanStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VALIDATED = 'validated',
}

export enum LmraDecision {
  GO = 'go',
  STOP = 'stop',
}
