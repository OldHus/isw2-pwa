import { useCallback, useEffect, useRef, useState } from "react";

import type { AttendanceRecord, AttendanceSession } from "../../../domain/model/AttendanceModels";
import type { CourseError, CourseStudent } from "../../../domain/model/CourseModels";
import { container } from "../../../di/container";
import { mapAttendanceErrorMessage } from "../shared/mapAttendanceErrorMessage";
import type { AttendanceEntry, TeacherAttendanceUiState } from "./TeacherAttendanceUiState";

export function useTeacherAttendanceViewModel(courseId: string) {
  const [uiState, setUiState] = useState<TeacherAttendanceUiState>({ type: "loading" });

  const courseStudentsRef = useRef<CourseStudent[]>([]);
  const activeSessionRef = useRef<AttendanceSession | null>(null);
  const lastEntriesRef = useRef<AttendanceEntry[]>([]);
  const unsubscribeRegistrationsRef = useRef<(() => void) | null>(null);

  const buildEntries = useCallback((records: AttendanceRecord[]): AttendanceEntry[] => {
    return [...records]
      .sort((a, b) => a.registeredAt - b.registeredAt)
      .map((record) => {
        const student = courseStudentsRef.current.find((s) => s.uid === record.studentUid);
        const trimmedName = student?.name?.trim();
        return {
          studentName: trimmedName ? trimmedName : record.studentUid,
          studentEmail: student?.email ?? "",
          registeredAtMillis: record.registeredAt,
        };
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeSession: (() => void) | undefined;

    async function start() {
      const studentsResult = await container.getCourseStudentsUseCase.execute(courseId);
      if (cancelled) return;

      if (!studentsResult.success) {
        setUiState({ type: "error", message: mapCourseErrorMessage(studentsResult.error) });
        return;
      }
      courseStudentsRef.current = studentsResult.data;

      unsubscribeSession = container.observeActiveAttendanceSessionUseCase.execute(
        courseId,
        (session) => {
          const previousSession = activeSessionRef.current;
          activeSessionRef.current = session;
          unsubscribeRegistrationsRef.current?.();
          unsubscribeRegistrationsRef.current = null;

          if (!session) {
            if (previousSession) {
              setUiState({ type: "expired", session: previousSession, entries: lastEntriesRef.current });
            } else {
              setUiState({ type: "noActiveSession" });
            }
            return;
          }

          unsubscribeRegistrationsRef.current = container.observeAttendanceRegistrationsUseCase.execute(
            courseId,
            session.id,
            (records) => {
              const entries = buildEntries(records);
              lastEntriesRef.current = entries;
              setUiState({ type: "active", session, entries });
            },
            (error) => {
              setUiState({ type: "error", message: mapAttendanceErrorMessage(error) });
            }
          );
        },
        (error) => {
          setUiState({ type: "error", message: mapAttendanceErrorMessage(error) });
        }
      );
    }

    start();

    return () => {
      cancelled = true;
      unsubscribeSession?.();
      unsubscribeRegistrationsRef.current?.();
    };
  }, [courseId, buildEntries]);

  const startSession = useCallback(
    async (code: string, durationMinutes: number) => {
      const result = await container.startAttendanceSessionUseCase.execute(courseId, code, durationMinutes);
      if (result.success) {
        container.analyticsReporter.logEvent("attendance_session_started", {
          course_id: courseId,
          duration_minutes: durationMinutes,
        });
      } else {
        setUiState({ type: "error", message: mapAttendanceErrorMessage(result.error) });
      }
    },
    [courseId]
  );
  
  const closeActiveSession = useCallback(async () => {
    const session = activeSessionRef.current;
    if (!session) return;
    const result = await container.closeAttendanceSessionUseCase.execute(courseId, session.id);
    if (result.success) {
      container.analyticsReporter.logEvent("attendance_session_closed", {
        course_id: courseId,
        session_id: session.id,
      });
    } else {
      setUiState({ type: "error", message: mapAttendanceErrorMessage(result.error) });
    }
  }, [courseId]);

  const dismissExpiredSession = useCallback(() => {
    lastEntriesRef.current = [];
    setUiState({ type: "noActiveSession" });
  }, []);

  const buildExportText = useCallback((): string => {
    if (uiState.type !== "active" && uiState.type !== "expired") return "";
    if (uiState.entries.length === 0) return "Ningún estudiante registró asistencia todavía.";

    const header = `Asistencia — código ${uiState.session.code}\n`;
    const lines = uiState.entries
      .map((entry) => {
        const time = new Date(entry.registeredAtMillis).toLocaleTimeString("es-CO", { hour12: false });
        return `${entry.studentName} - ${entry.studentEmail} - ${time}`;
      })
      .join("\n");
    return header + lines;
  }, [uiState]);

  return { uiState, startSession, closeActiveSession, dismissExpiredSession, buildExportText };
}


function mapCourseErrorMessage(error: CourseError): string {
  switch (error.type) {
    case "notFound":
      return "No se encontró el curso";
    case "unknown":
      return error.message || "No se pudieron cargar los estudiantes del curso";
  }
}