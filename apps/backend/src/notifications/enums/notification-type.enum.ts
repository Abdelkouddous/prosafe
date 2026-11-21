export enum NotificationType {
  INCIDENT = 'incident',
  INVENTORY = 'inventory',
  MAINTENANCE = 'maintenance',
  TRAINING = 'training',
  AUDIT = 'audit',
  EMERGENCY = 'emergency',
  MESSAGE = 'message',
  ALERT = 'alert',
  SYSTEM = 'system',
}

export type NotificationPriority = 'normal' | 'high';
