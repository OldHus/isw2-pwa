import { useCallback, useState } from "react";
import { container } from "../../../di/container";
import { useAppDispatch } from "../../../store/hooks";
import { setSession } from "../../../store/slices/sessionSlice";
import type { LoginUiState } from "../LoginUiState";
import type { AuthResult } from "../../../domain/model/AuthModels";

export function useAuthViewModel() {
  const [uiState, setUiState] = useState<LoginUiState>({ status: "idle" });
  const dispatch = useAppDispatch();

  const handleAuthSuccess = useCallback(
    (result: AuthResult, method: "google" | "email") => {
      if (result.type === "existingUser") {
        container.analyticsReporter.logEvent("sign_in_success", {
          user_type: "existing",
          role: result.role,
          method,
        });
        dispatch(
          setSession({
            uid: result.uid,
            role: result.role as any,
            courseId: result.courseId,
            name: result.name,
            photoUrl: result.photoUrl,
          })
        );
        setUiState({ status: "existingUserSuccess", role: result.role, courseId: result.courseId });
      } else {
        container.analyticsReporter.logEvent("sign_in_success", { user_type: "new", method });
        setUiState({ status: "newUserSuccess", uid: result.uid });
      }
    },
    [dispatch]
  );

  const onSignInWithGoogle = useCallback(async () => {
    if (uiState.status === "loading") return;
    setUiState({ status: "loading" });

    const result = await container.signInWithGoogleUseCase.execute();
    if (result.success) {
      handleAuthSuccess(result.data, "google");
      return;
    }

    switch (result.error.type) {
      case "cancelledByUser":
        setUiState({ status: "idle" });
        break;
      case "noInternet":
        setUiState({ status: "error", message: "Verifica tu conexión a internet" });
        break;
      case "domainNotAllowed":
        container.analyticsReporter.logEvent("sign_in_error", { reason: "domain_not_allowed", method: "google" });
        setUiState({ status: "error", message: "Debes iniciar sesión con tu correo institucional @unal.edu.co" });
        break;
      default:
        container.analyticsReporter.logEvent("sign_in_error", { reason: "unknown", method: "google" });
        setUiState({ status: "error", message: "No se pudo iniciar sesión. Intenta de nuevo" });
    }
  }, [uiState.status, handleAuthSuccess]);

  const onSignInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (uiState.status === "loading") return;

      if (!email.trim() || !password.trim()) {
        setUiState({ status: "error", message: "Ingresa correo y contraseña" });
        return;
      }

      setUiState({ status: "loading" });
      const result = await container.signInWithEmailPasswordUseCase.execute(email, password);

      if (result.success) {
        handleAuthSuccess(result.data, "email");
        return;
      }

      if (result.error.type === "invalidCredentials") {
        container.analyticsReporter.logEvent("sign_in_error", { reason: "invalid_credentials", method: "email" });
        setUiState({ status: "error", message: "Correo o contraseña inválidos" });
      } else {
        container.analyticsReporter.logEvent("sign_in_error", { reason: "unknown", method: "email" });
        setUiState({ status: "error", message: "No se pudo iniciar sesión. Intenta de nuevo" });
      }
    },
    [uiState.status, handleAuthSuccess]
  );

  return { uiState, onSignInWithGoogle, onSignInWithEmail };
}