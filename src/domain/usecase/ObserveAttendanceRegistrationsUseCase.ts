import type { AttendanceError, AttendanceRecord } from "../model/AttendanceModels";
import type { AttendanceRepository } from "../repository/AttendanceRepository";

export class ObserveAttendanceRegistrationsUseCase {
  private attendanceRepository: AttendanceRepository;

  constructor(attendanceRepository: AttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  execute(
    courseId: string,
    sessionId: string,
    onChange: (records: AttendanceRecord[]) => void,
    onError?: (error: AttendanceError) => void
  ): () => void {
    return this.attendanceRepository.observeSessionRegistrations(courseId, sessionId, onChange, onError);
  }
}
