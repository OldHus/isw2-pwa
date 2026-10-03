import { Copy, RefreshCw } from "lucide-react";
import { AppShell } from "../shell/AppShell";
import { useCourseSettingsViewModel } from "./hooks/useCourseSettingsViewModel";
import styles from "./CourseSettingsScreen.module.scss";

export function CourseSettingsScreen() {
  const {
    uiState,
    isConfirmingRegenerate,
    isRegenerating,
    copyFeedback,
    requestRegenerate,
    cancelRegenerate,
    confirmRegenerate,
    copyCode,
  } = useCourseSettingsViewModel();

  return (
    <AppShell>
      <div className={styles.screen}>
        <h1 className={styles.title}>Configuración del curso</h1>

        {copyFeedback ? (
          <p role="status" aria-live="polite" className={styles.feedback}>
            {copyFeedback}
          </p>
        ) : null}

        {uiState.status === "loading" && (
          <div className={styles.centered}>
            <div className={styles.spinner} aria-label="Cargando código" role="status" />
          </div>
        )}

        {uiState.status === "error" && (
          <p role="alert" className={styles.errorText}>
            {uiState.message}
          </p>
        )}

        {uiState.status === "success" && (
          <div className={styles.card}>
            <p className={styles.label}>Código de registro</p>
            <div className={styles.codeRow}>
              <span className={styles.code}>{uiState.accessCode}</span>
              <button type="button" className={styles.iconButton} onClick={copyCode} aria-label="Copiar código">
                <Copy size={18} aria-hidden="true" />
              </button>
            </div>
            <p className={styles.hint}>
              Comparte este código con tus estudiantes para que se registren en el curso.
            </p>

            {!isConfirmingRegenerate ? (
              <button type="button" className={styles.regenerateButton} onClick={requestRegenerate}>
                <RefreshCw size={16} aria-hidden="true" />
                Regenerar código
              </button>
            ) : (
              <div className={styles.confirmBox}>
                <p className={styles.confirmText}>
                  El código actual dejará de funcionar de inmediato. ¿Regenerar de todas formas?
                </p>
                <div className={styles.confirmActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={cancelRegenerate}
                    disabled={isRegenerating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={styles.confirmButton}
                    onClick={confirmRegenerate}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? "Regenerando..." : "Sí, regenerar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}