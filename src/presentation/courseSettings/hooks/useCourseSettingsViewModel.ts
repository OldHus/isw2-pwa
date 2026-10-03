import { useCallback, useEffect, useState } from "react";
import { container } from "../../../di/container";
import { useAppSelector } from "../../../store/hooks";
import type { CourseSettingsUiState } from "../CourseSettingsUiState";

export function useCourseSettingsViewModel() {
  const courseId = useAppSelector((state) => state.session.courseId);
  const [uiState, setUiState] = useState<CourseSettingsUiState>({ status: "loading" });
  const [isConfirmingRegenerate, setIsConfirmingRegenerate] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    setUiState({ status: "loading" });
    const result = await container.getCourseUseCase.execute(courseId);
    if (result.success) {
      setUiState({ status: "success", accessCode: result.data.accessCode });
    } else {
      setUiState({ status: "error", message: "No se pudo cargar el código del curso" });
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const requestRegenerate = useCallback(() => {
    setIsConfirmingRegenerate(true);
  }, []);

  const cancelRegenerate = useCallback(() => {
    setIsConfirmingRegenerate(false);
  }, []);

  const confirmRegenerate = useCallback(async () => {
    if (!courseId) return;
    setIsRegenerating(true);
    const result = await container.regenerateAccessCodeUseCase.execute(courseId);
    setIsRegenerating(false);
    setIsConfirmingRegenerate(false);

    if (result.success) {
      container.analyticsReporter.logEvent("course_code_regenerated", { course_id: courseId });
      setUiState({ status: "success", accessCode: result.data });
    } else {
      setUiState({ status: "error", message: "No se pudo regenerar el código" });
    }
  }, [courseId]);

  const copyCode = useCallback(async () => {
    if (uiState.status !== "success") return;
    try {
      await navigator.clipboard.writeText(uiState.accessCode);
      setCopyFeedback("Código copiado");
    } catch {
      setCopyFeedback("No se pudo copiar el código");
    }
    setTimeout(() => setCopyFeedback(null), 2000);
  }, [uiState]);

  return {
    uiState,
    isConfirmingRegenerate,
    isRegenerating,
    copyFeedback,
    requestRegenerate,
    cancelRegenerate,
    confirmRegenerate,
    copyCode,
  };
}