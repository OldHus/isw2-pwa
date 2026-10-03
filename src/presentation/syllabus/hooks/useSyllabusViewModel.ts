import { useCallback, useEffect, useState } from "react";
import { container } from "../../../di/container";
import { useAppSelector } from "../../../store/hooks";
import type { SyllabusUiState } from "../SyllabusUiState";

export function useSyllabusViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<SyllabusUiState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadSyllabus() {
      if (!session.courseId) {
        setUiState({ status: "error", message: "No se encontró tu curso asociado" });
        return;
      }

      setUiState({ status: "loading" });
      const result = await container.getSyllabusUrlUseCase.execute(session.courseId);

      if (!isMounted) return;

      if (result.success) {
        setUiState({ status: "success", url: result.data });
        container.analyticsReporter.logEvent("syllabus_viewed", { course_id: session.courseId });
      } else if (result.error.type === "notAvailable") {
        setUiState({ status: "notAvailable" });
      } else {
        setUiState({ status: "error", message: "No se pudo cargar el syllabus" });
      }
    }

    loadSyllabus();
    return () => {
      isMounted = false;
    };
  }, [session.courseId]);

  const onDownload = useCallback(async () => {
    if (uiState.status !== "success") return;

    try {
      const response = await fetch(uiState.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "syllabus.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      container.analyticsReporter.logEvent("syllabus_downloaded", { course_id: session.courseId ?? "" });
    } catch (error) {
      container.crashReporter.recordException(error);
    }
  }, [uiState, session.courseId]);

  return { uiState, onDownload };
}