/**
 * OHS alert types (docs/API_CONTRACT.md § Alerts).
 * `critical_incident` is raised when a critical incident is reported.
 */
export enum AlertType {
  INCIDENT_SPIKE = 'incident_spike',
  CRITICAL_INCIDENT = 'critical_incident',
  STOCK = 'stock',
  MAINTENANCE = 'maintenance',
  TRAINING = 'training',
  EMERGENCY = 'emergency',
  COMPLIANCE = 'compliance',
  RISK = 'risk',
  SYSTEM = 'system',
}
