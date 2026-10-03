import type { AppResult } from "../model/Result";
import type { AttendanceError, AttendanceRecord, AttendanceSession } from "../model/AttendanceModels";

export interface AttendanceRepository {
  //Teacher

  startSession(
    courseId: string,
    code: string,
    durationMinutes: number
  ): Promise<AppResult<AttendanceSession, AttendanceError>>;

  closeSession(courseId: string, sessionId: string): Promise<AppResult<void, AttendanceError>>;

  observeSessionRegistrations(
    courseId: string,
    sessionId: string,
    onChange: (records: AttendanceRecord[]) => void,
    onError?: (error: AttendanceError) => void
  ): () => void;

  //Shared

  getActiveSession(courseId: string): Promise<AppResult<AttendanceSession | null, AttendanceError>>;

  observeActiveSession(
    courseId: string,
    onChange: (session: AttendanceSession | null) => void,
    onError?: (error: AttendanceError) => void
  ): () => void;

  //Student

  submitAttendance(courseId: string, sessionId: string): Promise<AppResult<void, AttendanceError>>;

  hasSubmittedAttendance(
    courseId: string,
    sessionId: string
  ): Promise<AppResult<boolean, AttendanceError>>;
}