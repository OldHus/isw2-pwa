import type { AttendanceSession } from "../../../domain/model/AttendanceModels";

export type StudentAttendanceUiState =
  | { type: "loading" }
  | { type: "noActiveSession" }
  | { type: "pendingInput"; session: AttendanceSession; errorMessage?: string }
  | { type: "alreadySubmitted"; session: AttendanceSession }
  | { type: "error"; message: string };
