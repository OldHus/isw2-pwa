import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { container } from "../../../di/container";
import { useAppDispatch } from "../../../store/hooks";
import { setSession, UserRole } from "../../../store/slices/sessionSlice";
import { Routes as AppRoutePaths } from "../../../routes/Routes";
import type { CourseCodeUiState } from "../CourseCodeUiState";

export function useCourseCodeViewModel() {
  const [uiState, setUiState] = useState<CourseCodeUiState>({ status: "idle" });
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = container.observeSessionUseCase.execute((result) => {
      if (!result) {
        navigate(AppRoutePaths.login, { replace: true });
        return;
      }
      if (result.type === "existingUser") {
        navigate(result.role === UserRole.TEACHER ? AppRoutePaths.teacherHome : AppRoutePaths.studentHome, {
          replace: true,
        });
        return;
      }
      setIsCheckingSession(false);
    });
    return unsubscribe;
  }, [navigate]);

  const onSubmitCode = useCallback(
    async (code: string, photoFile: File | null) => {
      if (uiState.status === "loading") return;
      setUiState({ status: "loading" });

      const result = await container.redeemRegistrationCodeUseCase.execute(code, photoFile);
      if (result.success) {
        const { uid, role, courseId, name, photoUrl } = result.data;
        container.analyticsReporter.logEvent("course_code_redeemed", { course_id: courseId });
        dispatch(setSession({ uid, role: role as any, courseId, name, photoUrl }));
        setUiState({ status: "success", role, courseId });
        navigate(AppRoutePaths.studentHome, { replace: true });
        return;
      }

      switch (result.error.type) {
        case "emptyCode":
          setUiState({ status: "error", message: "Ingresa un código" });
          break;
        case "invalidCode":
          container.analyticsReporter.logEvent("course_code_rejected", { reason: "invalid_code" });
          setUiState({ status: "error", message: "Código inválido. Verifícalo e intenta de nuevo" });
          break;
        case "userNotAuthenticated":
          setUiState({ status: "error", message: "Tu sesión expiró. Inicia sesión de nuevo" });
          break;
        case "invalidPhoto":
          setUiState({ status: "error", message: "Formato de imagen no soportado. Usa JPG, PNG o WEBP" });
          break;
        case "photoTooLarge":
          setUiState({ status: "error", message: "La imagen supera el tamaño máximo permitido (5 MB)" });
          break;
        default:
          container.analyticsReporter.logEvent("course_code_rejected", { reason: "unknown" });
          setUiState({ status: "error", message: "Algo salió mal. Intenta de nuevo" });
      }
    },
    [uiState.status, dispatch, navigate]
  );

  return { uiState, isCheckingSession, onSubmitCode };
}