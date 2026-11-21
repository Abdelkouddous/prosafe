export enum SessionStatus {
  PLANNED = 'planned',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EnrollmentStatus {
  REGISTERED = 'registered',
  ATTENDED = 'attended',
  PASSED = 'passed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/** Days before expiry at which a certification is flagged `expiresSoon`. */
export const EXPIRES_SOON_DAYS = 30;
