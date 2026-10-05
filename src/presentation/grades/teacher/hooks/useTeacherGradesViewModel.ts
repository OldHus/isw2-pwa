import { useCallback, useEffect, useState } from "react";
import { container } from "../../../../di/container";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { clearAllDrafts } from "../../../../store/slices/gradesDraftSlice";
import type { GradeCellUpdate, GradeItemTypeValue } from "../../../../domain/model/GradeModels";
import type { TeacherGradesUiState } from "../TeacherGradesUiState";

function sortStudents<T extends { name: string; email: string }>(students: T[]): T[] {
  return [...students].sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email, "es")
  );
}

export function useTeacherGradesViewModel() {
  const session = useAppSelector((state) => state.session);
  const pending = useAppSelector((state) => state.gradesDraft.pending);
  const dispatch = useAppDispatch();
  const [uiState, setUiState] = useState<TeacherGradesUiState>({ status: "loading" });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingPending, setSavingPending] = useState(false);

  const load = useCallback(async () => {
    if (!session.courseId) {
      setUiState({ status: "error", message: "No se encontró el curso asociado" });
      return;
    }

    setUiState({ status: "loading" });
    const [itemsResult, studentsResult] = await Promise.all([
      container.getGradeItemsUseCase.execute(session.courseId),
      container.getCourseStudentsUseCase.execute(session.courseId),
    ]);

    if (!itemsResult.success) {
      setUiState({ status: "error", message: "No se pudieron cargar los ítems de calificación" });
      return;
    }
    if (!studentsResult.success) {
      setUiState({ status: "error", message: "No se pudo cargar la lista de estudiantes" });
      return;
    }

    setUiState({
      status: "success",
      items: itemsResult.data,
      students: sortStudents(studentsResult.data),
    });
  }, [session.courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const addItem = useCallback(
    async (name: string, type: GradeItemTypeValue) => {
      if (!session.courseId) return;

      const result = await container.addGradeItemUseCase.execute(session.courseId, name, 0, type);

      if (result.success) {
        container.analyticsReporter.logEvent("grade_item_added", {
          course_id: session.courseId,
          item_name: result.data.name,
          weight: result.data.weight,
          type: result.data.type,
        });
        await load();
      } else {
        setFeedback(result.error.type === "unknown" ? result.error.message : "No se pudo crear el ítem");
      }
    },
    [session.courseId, load]
  );

  const renameItem = useCallback(
    async (itemId: string, name: string) => {
      if (!session.courseId) return;

      const result = await container.updateGradeItemUseCase.execute(session.courseId, itemId, name);

      if (result.success) {
        container.analyticsReporter.logEvent("grade_item_renamed", {
          course_id: session.courseId,
          item_id: itemId,
        });
        await load();
      } else {
        setFeedback(result.error.type === "unknown" ? result.error.message : "No se pudo renombrar el ítem");
      }
    },
    [session.courseId, load]
  );

  const countStudentsGraded = useCallback(
    async (itemId: string) => {
      if (!session.courseId) return 0;
      const result = await container.getCourseGradesOverviewUseCase.execute(session.courseId);
      if (!result.success) return 0;
      return Object.values(result.data).filter((studentGrades) => itemId in studentGrades.grades).length;
    },
    [session.courseId]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!session.courseId) return;

      const result = await container.deleteGradeItemUseCase.execute(session.courseId, itemId);

      if (result.success) {
        container.analyticsReporter.logEvent("grade_item_deleted", {
          course_id: session.courseId,
          item_id: itemId,
        });
        setFeedback("Ítem eliminado");
        await load();
      } else {
        setFeedback(result.error.type === "unknown" ? result.error.message : "No se pudo eliminar el ítem");
      }
    },
    [session.courseId, load]
  );

  const consumeFeedback = useCallback(() => setFeedback(null), []);

  const totalPendingCells = Object.values(pending).reduce(
    (acc, byItem) => acc + Object.keys(byItem).length,
    0
  );
  const totalPendingStudents = Object.keys(pending).length;

  const discardAllPending = useCallback(() => {
    dispatch(clearAllDrafts());
    setFeedback("Cambios pendientes descartados");
  }, [dispatch]);

  const saveAllPending = useCallback(async () => {
    if (!session.courseId || totalPendingCells === 0 || savingPending) return;
    const updates: GradeCellUpdate[] = [];
    for (const [studentUid, byItem] of Object.entries(pending)) {
      for (const [itemId, grade] of Object.entries(byItem)) {
        updates.push({ studentUid, itemId, grade: grade as number | null });
      }
    }
    if (updates.length === 0) return;
    setSavingPending(true);
    const result = await container.setManyStudentGradesUseCase.execute(session.courseId, updates);
    setSavingPending(false);
    if (result.success) {
      container.analyticsReporter.logEvent("grades_batch_saved", {
        course_id: session.courseId,
        count: updates.length,
      });
      dispatch(clearAllDrafts());
      setFeedback(
        updates.length === 1 ? "1 calificación guardada" : `${updates.length} calificaciones guardadas`
      );
    } else if (result.error.type === "invalidGrade") {
      setFeedback(`Las notas deben estar entre ${result.error.min} y ${result.error.max}`);
    } else {
      setFeedback("No se pudieron guardar las calificaciones");
    }
  }, [session.courseId, pending, totalPendingCells, savingPending, dispatch]);

  return {
    uiState,
    feedback,
    addItem,
    renameItem,
    countStudentsGraded,
    deleteItem,
    consumeFeedback,
    pending,
    totalPendingCells,
    totalPendingStudents,
    savingPending,
    saveAllPending,
    discardAllPending,
  };
}
