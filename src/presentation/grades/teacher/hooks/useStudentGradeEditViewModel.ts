import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import type { StudentGradeEditUiState } from "../StudentGradeEditUiState";

export function useStudentGradeEditViewModel() {
  const { studentUid } = useParams<{ studentUid: string }>();
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<StudentGradeEditUiState>({ status: "loading" });
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session.courseId || !studentUid) {
      setUiState({ status: "error", message: "No se encontró el estudiante o el curso" });
      return;
    }

    setUiState({ status: "loading" });
    const [itemsResult, gradesResult, studentsResult] = await Promise.all([
      container.getGradeItemsUseCase.execute(session.courseId),
      container.getStudentGradesUseCase.execute(session.courseId, studentUid),
      container.getCourseStudentsUseCase.execute(session.courseId),
    ]);

    if (!itemsResult.success) {
      setUiState({ status: "error", message: "No se pudieron cargar los ítems" });
      return;
    }
    if (!gradesResult.success) {
      setUiState({ status: "error", message: "No se pudieron cargar las calificaciones" });
      return;
    }
    if (!studentsResult.success) {
      setUiState({ status: "error", message: "No se pudo cargar la información del estudiante" });
      return;
    }

    const student = studentsResult.data.find((candidate) => candidate.uid === studentUid);
    if (!student) {
      setUiState({ status: "error", message: "No se encontró el estudiante en este curso" });
      return;
    }

    setUiState({ status: "success", student, items: itemsResult.data, grades: gradesResult.data.grades });
  }, [session.courseId, studentUid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const saveGrade = useCallback(
    async (itemId: string, rawValue: string) => {
      if (!session.courseId || !studentUid) return;

      const normalized = rawValue.trim().replace(",", ".");
      const grade = Number(normalized);

      if (normalized.length === 0 || Number.isNaN(grade)) {
        setFeedback("Ingresa una nota válida");
        return;
      }

      const result = await container.setStudentGradeUseCase.execute(
        session.courseId,
        studentUid,
        itemId,
        grade
      );

      if (result.success) {
        container.analyticsReporter.logEvent("grade_saved", {
          course_id: session.courseId,
          item_id: itemId,
          grade,
        });
        setFeedback("Nota guardada");
        setUiState((current) =>
          current.status === "success"
            ? { ...current, grades: { ...current.grades, [itemId]: grade } }
            : current
        );
      } else if (result.error.type === "invalidGrade") {
        setFeedback(`La nota debe estar entre ${result.error.min} y ${result.error.max}`);
      } else {
        setFeedback("No se pudo guardar la nota");
      }
    },
    [session.courseId, studentUid]
  );

  const deleteGrade = useCallback(
    async (itemId: string) => {
      if (!session.courseId || !studentUid) return;

      const result = await container.deleteStudentGradeUseCase.execute(
        session.courseId,
        studentUid,
        itemId
      );

      if (result.success) {
        container.analyticsReporter.logEvent("grade_deleted", {
          course_id: session.courseId,
          item_id: itemId,
        });
        setFeedback("Nota eliminada");
        setUiState((current) => {
          if (current.status !== "success") return current;
          const nextGrades = { ...current.grades };
          delete nextGrades[itemId];
          return { ...current, grades: nextGrades };
        });
      } else {
        setFeedback("No se pudo eliminar la nota");
      }
    },
    [session.courseId, studentUid]
  );

  return { uiState, feedback, saveGrade, deleteGrade };
}