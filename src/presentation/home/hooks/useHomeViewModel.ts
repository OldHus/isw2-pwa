import { useCallback, useEffect, useState } from "react";
import { container } from "../../../di/container";
import { useAppSelector } from "../../../store/hooks";
import type { HomeUiState } from "../HomeUiState";

export function useHomeViewModel() {
  const session = useAppSelector((state) => state.session);
  const [uiState, setUiState] = useState<HomeUiState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadCourse() {
      if (!session.courseId) {
        setUiState({ status: "error", message: "No se encontró tu curso asociado" });
        return;
      }

      setUiState({ status: "loading" });
      const result = await container.getCourseUseCase.execute(session.courseId);

      if (!isMounted) return;

      if (result.success) {
        setUiState({ status: "success", course: result.data });
      } else {
        setUiState({ status: "error", message: "No se pudo cargar la información del curso" });
      }
    }

    loadCourse();
    return () => {
      isMounted = false;
    };
  }, [session.courseId]);

  const onModuleTapped = useCallback((moduleId: string, implemented: boolean) => {
    container.analyticsReporter.logEvent("home_module_tapped", { module_id: moduleId, implemented });
  }, []);

  return { uiState, session, onModuleTapped };
}