import { useCallback, useEffect, useState } from "react";
import { container } from "../../../../di/container";
import { useAppSelector } from "../../../../store/hooks";
import type { GradeCellUpdate } from "../../../../domain/model/GradeModels";
import type { GradesMatrixUiState } from "../GradesMatrixUiState";

function sortStudents<T extends { name: string; email: string }>(students: T[]): T[] {
  return [...students].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "es"));
}

function cellKey(studentUid: string, itemId: string): string {
  return `${studentUid}:${itemId}`;
}

function normalizeRaw(raw: string): string {
  return raw.trim().replace(",", ".");
}

export function useGradesMatrixViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<GradesMatrixUiState>({ status: "loading" });
  const [draft, setDraft] = useState<Record<string, Record<string, string>>>({});
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
        items: itemsResult.data,
        students: sortStudents(studentsResult.data),
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

  const getOriginal = useCallback(
    (studentUid: string, itemId: string): number | undefined => {
      if (uiState.status !== "success") return undefined;
      return uiState.grades[studentUid]?.[itemId];
    },
    [uiState]
  );

  const updateCell = useCallback(
    (studentUid: string, itemId: string, raw: string) => {
      const original = getOriginal(studentUid, itemId);
      const normalized = normalizeRaw(raw);

      let isSameAsOriginal = false;
      if (normalized === "") {
        isSameAsOriginal = original === undefined;
      } else {
        const parsed = Number(normalized);
        isSameAsOriginal =
          original !== undefined && !Number.isNaN(parsed) && parsed === original;
      }

      setDraft((current) => {
        const studentDraft = current[studentUid] ?? {};
        if (isSameAsOriginal) {
          if (!(itemId in studentDraft)) return current;
          const nextStudentDraft = { ...studentDraft };
          delete nextStudentDraft[itemId];
          const next = { ...current };
          if (Object.keys(nextStudentDraft).length === 0) {
            delete next[studentUid];
          } else {
            next[studentUid] = nextStudentDraft;
          }
          return next;
        }
        return { ...current, [studentUid]: { ...studentDraft, [itemId]: raw } };
      });

      const key = cellKey(studentUid, itemId);
      if (isSameAsOriginal || normalized === "") {
        setErrors((current) => {
          if (!(key in current)) return current;
          const next = { ...current };
          delete next[key];
          return next;
        });
        return;
      }
      const parsed = Number(normalized);
      if (Number.isNaN(parsed)) {
        setErrors((current) => ({ ...current, [key]: "Ingresa una nota válida" }));
      } else if (parsed < 0 || parsed > 5) {
        setErrors((current) => ({ ...current, [key]: "La nota debe estar entre 0 y 5" }));
      } else {
        setErrors((current) => {
          if (!(key in current)) return current;
          const next = { ...current };
          delete next[key];
          return next;
        });
      }
    },
    [getOriginal]
  );

  const dirtyCount = Object.values(draft).reduce((acc, byItem) => acc + Object.keys(byItem).length, 0);
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
        const normalized = normalizeRaw(raw);
        if (normalized === "") {
          if (uiState.grades[studentUid]?.[itemId] === undefined) continue;
          updates.push({ studentUid, itemId, grade: null });
        } else {
          const parsed = Number(normalized);
          if (Number.isNaN(parsed)) continue;
          updates.push({ studentUid, itemId, grade: parsed });
        }
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
      setFeedback(`Las notas deben estar entre ${result.error.min} y ${result.error.max}`);
    } else {
      setFeedback("No se pudieron guardar las calificaciones");
    }
  }, [session.courseId, uiState, draft, dirtyCount, hasErrors, saving]);

  return { uiState, draft, errors, dirtyCount, hasErrors, saving, feedback, updateCell, saveAll, discard };
}
