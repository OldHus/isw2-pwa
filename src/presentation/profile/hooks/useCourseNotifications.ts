import { useEffect, useState } from "react";
import { container } from "../../../di/container";
import type { NotificationPermissionState } from "../../../domain/model/NotificationModels";

export type NotificationsUiStatus = "idle" | "requesting" | "error";

export interface CourseNotificationsState {
  permission: NotificationPermissionState;
  subscribed: boolean;
  status: NotificationsUiStatus;
  errorMessage: string | null;
}

const SUBSCRIBED_STORAGE_KEY = "isw2:notificationsSubscribed";

function readStoredSubscribed(): boolean {
  try {
    return localStorage.getItem(SUBSCRIBED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStoredSubscribed(value: boolean) {
  try {
    localStorage.setItem(SUBSCRIBED_STORAGE_KEY, value ? "true" : "false");
  } catch {
    // Storage no available
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  unsupported: "Tu navegador no soporta notificaciones push.",
  "permission-denied": "No se concedió el permiso de notificaciones.",
  "token-failed": "No se pudo generar el token de notificaciones.",
  "subscribe-failed": "No se pudo activar la suscripción. Intenta de nuevo.",
  "not-authenticated": "Debes iniciar sesión de nuevo.",
  unknown: "Ocurrió un error inesperado.",
};

export function useCourseNotifications() {
  const [state, setState] = useState<CourseNotificationsState>(() => ({
    permission: container.notificationRepository.getPermissionState(),
    subscribed: readStoredSubscribed(),
    status: "idle",
    errorMessage: null,
  }));

  useEffect(() => {
    const permissionsApi = (navigator as Navigator & { permissions?: Permissions }).permissions;
    if (!permissionsApi) return;

    let cancelled = false;

    permissionsApi
      .query({ name: "notifications" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        const handleChange = () => {
          setState((previous) => ({
            ...previous,
            permission: container.notificationRepository.getPermissionState(),
          }));
        };
        status.addEventListener("change", handleChange);
      })
      .catch(() => {
        // Permissions API (p. ej. Safari) — it's ignore
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function activate() {
    setState((previous) => ({ ...previous, status: "requesting", errorMessage: null }));
    const result = await container.subscribeToCourseNotificationsUseCase.execute();
    if (result.success) {
      writeStoredSubscribed(true);
      setState({
        permission: container.notificationRepository.getPermissionState(),
        subscribed: true,
        status: "idle",
        errorMessage: null,
      });
    } else {
      setState((previous) => ({
        ...previous,
        permission: container.notificationRepository.getPermissionState(),
        status: "error",
        errorMessage: ERROR_MESSAGES[result.error.type] ?? ERROR_MESSAGES.unknown,
      }));
    }
  }

  async function deactivate() {
    setState((previous) => ({ ...previous, status: "requesting", errorMessage: null }));
    const result = await container.unsubscribeFromCourseNotificationsUseCase.execute();
    if (result.success) {
      writeStoredSubscribed(false);
      setState({
        permission: container.notificationRepository.getPermissionState(),
        subscribed: false,
        status: "idle",
        errorMessage: null,
      });
    } else {
      setState((previous) => ({
        ...previous,
        permission: container.notificationRepository.getPermissionState(),
        status: "error",
        errorMessage: ERROR_MESSAGES[result.error.type] ?? ERROR_MESSAGES.unknown,
      }));
    }
  }

  return { ...state, activate, deactivate };
}