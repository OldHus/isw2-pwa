import { useCallback, useState } from "react";
import { container } from "../../../di/container";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setPhotoUrl } from "../../../store/slices/sessionSlice";
import type { ProfileUiState } from "../ProfileUiState";

export function useProfileViewModel() {
  const session = useAppSelector((state) => state.session);
  const dispatch = useAppDispatch();
  const [uiState, setUiState] = useState<ProfileUiState>({ status: "idle" });

  const uploadPhoto = useCallback(
    async (file: File) => {
      if (!session.uid) return;
      setUiState({ status: "loading" });

      const result = await container.uploadProfilePhotoUseCase.execute(session.uid, file);
      if (result.success) {
        container.analyticsReporter.logEvent("profile_photo_updated", {});
        dispatch(setPhotoUrl(result.data));
        setUiState({ status: "success", message: "Foto actualizada" });
        return;
      }

      switch (result.error.type) {
        case "invalidFile":
          setUiState({ status: "error", message: "Formato no soportado. Usa JPG, PNG o WEBP" });
          break;
        case "tooLarge":
          setUiState({ status: "error", message: "La imagen supera el tamaño máximo permitido (5 MB)" });
          break;
        default:
          setUiState({ status: "error", message: "No se pudo subir la foto. Intenta de nuevo" });
      }
    },
    [session.uid, dispatch]
  );

  const removePhoto = useCallback(async () => {
    if (!session.uid) return;
    setUiState({ status: "loading" });

    const result = await container.removeProfilePhotoUseCase.execute(session.uid);
    if (result.success) {
      container.analyticsReporter.logEvent("profile_photo_removed", {});
      dispatch(setPhotoUrl(null));
      setUiState({ status: "success", message: "Foto eliminada" });
      return;
    }

    setUiState({ status: "error", message: "No se pudo quitar la foto. Intenta de nuevo" });
  }, [session.uid, dispatch]);

  return { session, uiState, uploadPhoto, removePhoto };
}