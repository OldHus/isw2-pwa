import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { container } from "../../../../di/container";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { removeStudent, stageStudentGrades } from "../../../../store/slices/gradesDraftSlice";
import type { GradeCellUpdate } from "../../../../domain/model/GradeModels";
import {
  gradeInputError,
  isGradeDirty,
  normalizeGradeText,
  parseGradeInput,
  sortGradeItemsByCreationAsc,
} from "../gradePresentation";
import type { StudentGradeEditUiState } from "../StudentGradeEditUiState";

type DraftState = Record<string, string>;

function parseDraftToGrades(
  source: DraftState,
  serverGrades: Record<string, number>,
  pendingForStudent: Record<string, number | null>
): Record<string, number | null> {
  const parsed: Record<string, number | null> = {};

  for (const [itemId, raw] of Object.entries(source)) {
    const baseline = itemId in pendingForStudent ? pendingForStudent[itemId] : serverGrades[itemId];
    const grade = parseGradeInput(raw);

    if (grade.status === "invalid") continue;

    if (grade.status === "empty") {
      if (typeof baseline !== "number") continue;
      parsed[itemId] = null;
      continue;
    }

    if (typeof baseline === "number" && grade.value === baseline) continue;
    parsed[itemId] = grade.value;
  }

  return parsed;
}

export function useStudentGradeEditViewModel() {
  const { studentUid } = useParams<{ studentUid: string }>();
  const session = useAppSelector((state) => state.session);
  const pendingForStudent = useAppSelector((state) =>
    studentUid ? (state.gradesDraft.pending[studentUid] ?? {}) : {}
  );
  const dispatch = useAppDispatch();
  const [uiState, setUiState] = useState<StudentGradeEditUiState>({ status: "loading" });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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

    setUiState({
      status: "success",
      student,
      items: sortGradeItemsByCreationAsc(itemsResult.data),
      grades: gradesResult.data.grades,
    });
    setDraft({});
    setErrors({});
  }, [session.courseId, studentUid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const getBaseline = useCallback(
    (itemId: string): number | null | undefined => {
      if (itemId in pendingForStudent) {
        return pendingForStudent[itemId];
      }
      if (uiState.status !== "success") return undefined;
      return uiState.grades[itemId];
    },
    [pendingForStudent, uiState]
  );

  const updateValue = useCallback(
    (itemId: string, raw: string) => {
      const parsed = parseGradeInput(raw);
      const baseline = getBaseline(itemId);

      setDraft((current) => {
        if (parsed.status === "empty" && (baseline === undefined || baseline === null)) {
          if (!(itemId in current)) return current;
          const next = { ...current };
          delete next[itemId];
          return next;
        }
        return { ...current, [itemId]: raw };
      });

      const error = gradeInputError(parsed);
      setErrors((current) => {
        if (!error) {
          if (!(itemId in current)) return current;
          const next = { ...current };
          delete next[itemId];
          return next;
        }
        return { ...current, [itemId]: error };
      });
    },
    [getBaseline]
  );

  const normalizeValue = useCallback(
    (itemId: string) => {
      setDraft((current) => {
        const raw = current[itemId];
        if (raw === undefined) return current;

        const parsed = parseGradeInput(raw);
        if (parsed.status !== "valid") return current;

        const baseline = getBaseline(itemId);
        if (typeof baseline === "number" && parsed.value === baseline) {
          const next = { ...current };
          delete next[itemId];
          return next;
        }

        const normalized = normalizeGradeText(raw);
        if (normalized === null || normalized === raw) return current;
        return { ...current, [itemId]: normalized };
      });
    },
    [getBaseline]
  );

  const dirtyItemIds = Object.keys(draft).filter((itemId) =>
    isGradeDirty(draft[itemId], getBaseline(itemId))
  );
  const dirtyCount = dirtyItemIds.length;
  const pendingCount = Object.keys(pendingForStudent).length;
  const totalUnsaved = new Set([...dirtyItemIds, ...Object.keys(pendingForStudent)]).size;
  const hasErrors = Object.keys(errors).length > 0;

  const discard = useCallback(() => {
    setDraft({});
    setErrors({});
    if (studentUid) {
      dispatch(removeStudent({ studentUid }));
    }
    setFeedback("Cambios descartados");
  }, [dispatch, studentUid]);

  const stageAndContinue = useCallback(() => {
    if (!studentUid || uiState.status !== "success") return 0;
    if (dirtyCount === 0 || hasErrors) return pendingCount;

    const parsed = parseDraftToGrades(draft, uiState.grades, pendingForStudent);
    if (Object.keys(parsed).length > 0) {
      dispatch(stageStudentGrades({ studentUid, grades: parsed }));
    }
    setDraft({});
    setErrors({});
    return pendingCount + Object.keys(parsed).length;
  }, [
    studentUid,
    uiState,
    draft,
    dirtyCount,
    hasErrors,
    pendingCount,
    pendingForStudent,
    dispatch,
  ]);

  const saveHere = useCallback(async () => {
    if (!session.courseId || !studentUid || uiState.status !== "success") return;
    if ((dirtyCount === 0 && pendingCount === 0) || hasErrors || saving) return;

    const fromDraft = parseDraftToGrades(draft, uiState.grades, pendingForStudent);
    const merged: Record<string, number | null> = { ...pendingForStudent, ...fromDraft };
    const updates: GradeCellUpdate[] = Object.entries(merged).map(([itemId, grade]) => ({
      studentUid,
      itemId,
      grade,
    }));

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
        const nextGrades = { ...current.grades };
        for (const update of updates) {
          if (update.grade === null) {
            delete nextGrades[update.itemId];
          } else {
            nextGrades[update.itemId] = update.grade;
          }
        }
        return { ...current, grades: nextGrades };
      });
      dispatch(removeStudent({ studentUid }));
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
  }, [
    session.courseId,
    studentUid,
    uiState,
    draft,
    pendingForStudent,
    dirtyCount,
    pendingCount,
    hasErrors,
    saving,
    dispatch,
  ]);

  return {
    uiState,
    feedback,
    draft,
    pendingForStudent,
    errors,
    dirtyCount,
    pendingCount,
    totalUnsaved,
    hasErrors,
    saving,
    updateValue,
    normalizeValue,
    saveHere,
    stageAndContinue,
    discard,
  };
}
