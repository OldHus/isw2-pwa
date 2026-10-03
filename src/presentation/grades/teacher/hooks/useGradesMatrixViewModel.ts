import { useEffect, useState } from "react";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import type { GradesMatrixUiState } from "../GradesMatrixUiState";

function sortStudents<T extends { name: string; email: string }>(students: T[]): T[] {
  return [...students].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "es"));
}

export function useGradesMatrixViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<GradesMatrixUiState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!session.courseId) {
        setUiState({ status: "error", message: "No se encontró el curso asociado" });
        return;
      }

      setUiState({ status: "loading" });
      const [itemsResult, studentsResult, overviewResult] = await Promise.all([
        container.getGradeItemsUseCase.execute(session.courseId),
        container.getCourseStudentsUseCase.execute(session.courseId),
        container.getCourseGradesOverviewUseCase.execute(session.courseId),
      ]);

      if (!isMounted) return;

      if (!itemsResult.success) {
        setUiState({ status: "error", message: "No se pudieron cargar los ítems" });
        return;
      }
      if (!studentsResult.success) {
        setUiState({ status: "error", message: "No se pudo cargar la lista de estudiantes" });
        return;
      }
      if (!overviewResult.success) {
        setUiState({ status: "error", message: "No se pudieron cargar las calificaciones" });
        return;
      }

      const grades: Record<string, Record<string, number>> = {};
      for (const [uid, studentGrades] of Object.entries(overviewResult.data)) {
        grades[uid] = studentGrades.grades;
      }

      setUiState({
        status: "success",
        items: itemsResult.data,
        students: sortStudents(studentsResult.data),
        grades,
      });
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [session.courseId]);

  return { uiState };
}