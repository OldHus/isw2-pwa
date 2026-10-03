import { useCallback, useEffect, useRef, useState } from "react";

import type { AttendanceSession } from "../../../domain/model/AttendanceModels";
import { container } from "../../../di/container";
import { mapAttendanceErrorMessage } from "../shared/mapAttendanceErrorMessage";
import type { StudentAttendanceUiState } from "./StudentAttendanceUiState";

export function useStudentAttendanceViewModel(courseId: string) {
  const [uiState, setUiState] = useState<StudentAttendanceUiState>({ type: "loading" });
  const sessionRef = useRef<AttendanceSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = container.observeActiveAttendanceSessionUseCase.execute(
      courseId,
      (session) => {
        sessionRef.current = session;
        onSessionUpdate(session);
      },
      (error) => {
        if (!cancelled) {
          setUiState({ type: "error", message: mapAttendanceErrorMessage(error) });
        }
      }
    );

    async function onSessionUpdate(session: AttendanceSession | null) {
      if (!session) {
        if (!cancelled) setUiState({ type: "noActiveSession" });
        return;
      }
      const result = await container.hasSubmittedAttendanceUseCase.execute(courseId, session.id);
      if (cancelled) return;

      const alreadySubmitted = result.success ? result.data : false;
      setUiState(
        alreadySubmitted ? { type: "alreadySubmitted", session } : { type: "pendingInput", session }
      );
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [courseId]);

  const submitCode = useCallback(
    async (enteredCode: string) => {
      if (uiState.type !== "pendingInput") return;
      const { session } = uiState;

      const result = await container.submitAttendanceUseCase.execute(courseId, session, enteredCode);
      if (result.success) {
        container.analyticsReporter.logEvent("attendance_submitted", {
          course_id: courseId,
          session_id: session.id,
        });
        setUiState({ type: "alreadySubmitted", session });
      } else {
        container.analyticsReporter.logEvent("attendance_submit_error", {
          course_id: courseId,
          session_id: session.id,
        });
        setUiState({ type: "pendingInput", session, errorMessage: mapAttendanceErrorMessage(result.error) });
      }
    },
    [courseId, uiState]
  );

  return { uiState, submitCode };
}