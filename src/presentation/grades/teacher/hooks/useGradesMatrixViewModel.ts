import { useCallback, useEffect, useMemo, useState } from "react";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import type { GradeCellUpdate } from "../../../../domain/model/GradeModels";
import {
  gradeInputError,
  isGradeDirty,
  normalizeGradeText,
  parseGradeInput,
  sortGradeItemsByCreationAsc,
  sortStudentsBySurname,
} from "../gradePresentation";
import type { GradesMatrixUiState } from "../GradesMatrixUiState";

type DraftState = Record<string, Record<string, string>>;

function cellKey(studentUid: string, itemId: string): string {
  return `${studentUid}:${itemId}`;
}

function removeDraftCell(draft: DraftState, studentUid: string, itemId: string): DraftState {
  const studentDraft = draft[studentUid];
  if (!studentDraft || !(itemId in studentDraft)) return draft;

  const nextStudentDraft = { ...studentDraft };
  delete nextStudentDraft[itemId];

  const next = { ...draft };
  if (Object.keys(nextStudentDraft).length === 0) {
    delete next[studentUid];
  } else {
    next[studentUid] = nextStudentDraft;
  }
  return next;
}

export function useGradesMatrixViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<GradesMatrixUiState>({ status: "loading" });
  const [draft, setDraft] = useState<DraftState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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
        items: sortGradeItemsByCreationAsc(itemsResult.data),
        students: sortStudentsBySurname(studentsResult.data),
        grades,
      });
      setDraft({});
      setErrors({});
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [session.courseId]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const updateCell = useCallback(
    (studentUid: string, itemId: string, raw: string) => {
      const parsed = parseGradeInput(raw);

      setDraft((current) => {
        if (parsed.status === "empty" && uiState.status === "success") {
          const original = uiState.grades[studentUid]?.[itemId];
          if (original === undefined) {
            return removeDraftCell(current, studentUid, itemId);
          }
        }
        const studentDraft = current[studentUid] ?? {};
        return { ...current, [studentUid]: { ...studentDraft, [itemId]: raw } };
      });

      const key = cellKey(studentUid, itemId);
      const error = gradeInputError(parsed);
      setErrors((current) => {
        if (!error) {
          if (!(key in current)) return current;
          const next = { ...current };
          delete next[key];
          return next;
        }
        return { ...current, [key]: error };
      });
    },
    [uiState]
  );

  const normalizeCell = useCallback(
    (studentUid: string, itemId: string) => {
      setDraft((current) => {
        const raw = current[studentUid]?.[itemId];
        if (raw === undefined) return current;

        const parsed = parseGradeInput(raw);
        if (parsed.status !== "valid") return current;

        const original =
          uiState.status === "success" ? uiState.grades[studentUid]?.[itemId] : undefined;
        if (original !== undefined && parsed.value === original) {
          return removeDraftCell(current, studentUid, itemId);
        }

        const normalized = normalizeGradeText(raw);
        if (normalized === null || normalized === raw) return current;
        return { ...current, [studentUid]: { ...current[studentUid], [itemId]: normalized } };
      });
    },
    [uiState]
  );

  const dirtyCount = useMemo(() => {
    if (uiState.status !== "success") return 0;

    let count = 0;
    for (const [studentUid, byItem] of Object.entries(draft)) {
      for (const [itemId, raw] of Object.entries(byItem)) {
        if (isGradeDirty(raw, uiState.grades[studentUid]?.[itemId])) {
          count += 1;
        }
      }
    }
    return count;
  }, [draft, uiState]);

  const hasErrors = Object.keys(errors).length > 0;

  const discard = useCallback(() => {
    setDraft({});
    setErrors({});
    setFeedback("Cambios descartados");
  }, []);

  const saveAll = useCallback(async () => {
    if (!session.courseId || uiState.status !== "success") return;
    if (dirtyCount === 0 || hasErrors || saving) return;

    const updates: GradeCellUpdate[] = [];
    for (const [studentUid, byItem] of Object.entries(draft)) {
      for (const [itemId, raw] of Object.entries(byItem)) {
        const original = uiState.grades[studentUid]?.[itemId];
        const parsed = parseGradeInput(raw);

        if (parsed.status === "invalid") continue;
        if (parsed.status === "empty") {
          if (original === undefined) continue;
          updates.push({ studentUid, itemId, grade: null });
          continue;
        }
        if (original !== undefined && parsed.value === original) continue;
        updates.push({ studentUid, itemId, grade: parsed.value });
      }
    }

    if (updates.length === 0) {
      setDraft({});
      return;
    }

    setSaving(true);
    const result = await container.setManyStudentGradesUseCase.execute(session.courseId, updates);
    setSaving(false);

    if (result.success) {
      container.analyticsReporter.logEvent("grades_batch_saved", {
        course_id: session.courseId,
        count: updates.length,
      });
      setUiState((current) => {
        if (current.status !== "success") return current;
        const nextGrades: Record<string, Record<string, number>> = { ...current.grades };
        for (const update of updates) {
          const studentGrades = { ...(nextGrades[update.studentUid] ?? {}) };
          if (update.grade === null) {
            delete studentGrades[update.itemId];
          } else {
            studentGrades[update.itemId] = update.grade;
          }
          nextGrades[update.studentUid] = studentGrades;
        }
        return { ...current, grades: nextGrades };
      });
      setDraft({});
      setErrors({});
      setFeedback(
        updates.length === 1 ? "1 calificación guardada" : `${updates.length} calificaciones guardadas`
      );
    } else if (result.error.type === "invalidGrade") {
      setFeedback("La nota debe ser un número mayor o igual a 0");
    } else {
      setFeedback("No se pudieron guardar las calificaciones");
    }
  }, [session.courseId, uiState, draft, dirtyCount, hasErrors, saving]);

  return {
    uiState,
    draft,
    errors,
    dirtyCount,
    hasErrors,
    saving,
    feedback,
    updateCell,
    normalizeCell,
    saveAll,
    discard,
  };
}
