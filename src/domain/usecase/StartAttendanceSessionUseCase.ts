import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { AttendanceError, AttendanceSession } from "../model/AttendanceModels";
import type { AttendanceRepository } from "../repository/AttendanceRepository";

export class StartAttendanceSessionUseCase {
  private attendanceRepository: AttendanceRepository;

  constructor(attendanceRepository: AttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  async execute(
    courseId: string,
    code: string,
    durationMinutes: number
  ): Promise<AppResult<AttendanceSession, AttendanceError>> {
    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      return failure({ type: "emptyCode" });
    }
    if (durationMinutes <= 0) {
      return failure({ type: "invalidDuration" });
    }
    return this.attendanceRepository.startSession(courseId, trimmedCode, durationMinutes);
  }
}