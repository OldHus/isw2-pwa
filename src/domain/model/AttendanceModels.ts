
export interface AttendanceSession {
  id: string;
  code: string;
  isActive: boolean;
  durationMinutes: number;
  createdAt: number;
  expiresAt: number; 
}

export interface AttendanceRecord {
  studentUid: string;
  registeredAt: number;
}

export type AttendanceError =
  | { type: "emptyCode" }
  | { type: "invalidDuration" }
  | { type: "noActiveSession" }
  | { type: "invalidCode" }
  | { type: "sessionExpired" }
  | { type: "alreadyRegistered" }
  | { type: "unknown"; message: string };