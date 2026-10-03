import type { AttendanceError, AttendanceSession } from "../model/AttendanceModels";
import type { AttendanceRepository } from "../repository/AttendanceRepository";

export class ObserveActiveAttendanceSessionUseCase {
  private attendanceRepository: AttendanceRepository;

  constructor(attendanceRepository: AttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  execute(
    courseId: string,
    onChange: (session: AttendanceSession | null) => void,
    onError?: (error: AttendanceError) => void
  ): () => void {
    return this.attendanceRepository.observeActiveSession(courseId, onChange, onError);
  }
}
