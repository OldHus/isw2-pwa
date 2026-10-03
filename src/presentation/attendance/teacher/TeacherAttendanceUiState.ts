import type { AttendanceSession } from "../../../domain/model/AttendanceModels";

export interface AttendanceEntry {
  studentName: string;
  studentEmail: string;
  registeredAtMillis: number;
}

export type TeacherAttendanceUiState =
  | { type: "loading" }
  | { type: "noActiveSession" }
  | { type: "active"; session: AttendanceSession; entries: AttendanceEntry[] }
  | { type: "expired"; session: AttendanceSession; entries: AttendanceEntry[] }
  | { type: "error"; message: string };