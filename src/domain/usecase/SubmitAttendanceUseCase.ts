import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { AttendanceError, AttendanceSession } from "../model/AttendanceModels";
import type { AttendanceRepository } from "../repository/AttendanceRepository";

export class SubmitAttendanceUseCase {
  private attendanceRepository: AttendanceRepository;

  constructor(attendanceRepository: AttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  async execute(
    courseId: string,
    session: AttendanceSession,
    enteredCode: string
  ): Promise<AppResult<void, AttendanceError>> {
    if (!session.isActive) {
      return failure({ type: "noActiveSession" });
    }
    if (Date.now() > session.expiresAt) {
      return failure({ type: "sessionExpired" });
    }
    if (enteredCode.trim() !== session.code) {
      return failure({ type: "invalidCode" });
    }
    return this.attendanceRepository.submitAttendance(courseId, session.id);
  }
}