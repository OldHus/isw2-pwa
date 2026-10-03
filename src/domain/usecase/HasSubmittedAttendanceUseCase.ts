import type { AppResult } from "../model/Result";
import type { AttendanceError } from "../model/AttendanceModels";
import type { AttendanceRepository } from "../repository/AttendanceRepository";

export class HasSubmittedAttendanceUseCase {
  private attendanceRepository: AttendanceRepository;

  constructor(attendanceRepository: AttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  async execute(courseId: string, sessionId: string): Promise<AppResult<boolean, AttendanceError>> {
    return this.attendanceRepository.hasSubmittedAttendance(courseId, sessionId);
  }
}