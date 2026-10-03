import type { AppResult } from "../model/Result";
import type { AttendanceError } from "../model/AttendanceModels";
import type { AttendanceRepository } from "../repository/AttendanceRepository";

export class CloseAttendanceSessionUseCase {
  private attendanceRepository: AttendanceRepository;

  constructor(attendanceRepository: AttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  async execute(courseId: string, sessionId: string): Promise<AppResult<void, AttendanceError>> {
    return this.attendanceRepository.closeSession(courseId, sessionId);
  }
}