import { useEffect, useState } from "react";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import type { StudentGradesUiState } from "../StudentGradesUiState";

export function useStudentGradesViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<StudentGradesUiState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadGrades() {
      if (!session.courseId) {
        setUiState({ status: "error", message: "No se encontró tu curso asociado" });
        return;
      }

      setUiState({ status: "loading" });

      const [itemsResult, gradesResult] = await Promise.all([
        container.getGradeItemsUseCase.execute(session.courseId),
        container.getMyGradesUseCase.execute(session.courseId),
      ]);

      if (!isMounted) return;

      if (!itemsResult.success) {
        setUiState({ status: "error", message: "No se pudieron cargar los ítems de calificación" });
        return;
      }
      if (!gradesResult.success) {
        setUiState({ status: "error", message: "No se pudieron cargar tus calificaciones" });
        return;
      }

      setUiState({ status: "success", items: itemsResult.data, grades: gradesResult.data.grades });
      container.analyticsReporter.logEvent("grades_viewed", { course_id: session.courseId });
    }

    loadGrades();
    return () => {
      isMounted = false;
    };
  }, [session.courseId]);

  return { uiState };
}