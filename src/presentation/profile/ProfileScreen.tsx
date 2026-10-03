import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, Bell, BellOff } from "lucide-react";
import { AppShell } from "../shell/AppShell";
import { useProfileViewModel } from "./hooks/useProfileViewModel";
import { useCourseNotifications } from "./hooks/useCourseNotifications";
import { Avatar } from "../common/Avatar";
import { ProfilePhotoCropDialog } from "./ProfilePhotoCropDialog";
import { UserRole } from "../../store/slices/sessionSlice";
import styles from "./ProfileScreen.module.scss";

export function ProfileScreen() {
  const { session, uiState, uploadPhoto, removePhoto } = useProfileViewModel();
  const notifications = useCourseNotifications();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isLoading = uiState.status === "loading";
  const hasCustomPhoto = Boolean(previewUrl) || Boolean(session.photoUrl);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingCropFile(file);
  };

  const handleCropCancel = () => {
    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = (croppedFile: File) => {
    setPendingCropFile(null);
    setPreviewUrl(URL.createObjectURL(croppedFile));
    uploadPhoto(croppedFile);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    removePhoto();
  };

  const displayUrl = previewUrl ?? session.photoUrl;

  return (
    <AppShell>
      <div className={styles.screen}>
        <h1 className={styles.title}>Mi perfil</h1>

        <div className={styles.photoBlock}>
          <Avatar photoUrl={displayUrl} role={session.role} name={session.name} size={96} />

          <div className={styles.photoActions}>
            <button
              type="button"
              className={styles.changeButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Camera size={16} aria-hidden="true" />
              {isLoading ? "Procesando..." : "Cambiar foto"}
            </button>
            {hasCustomPhoto && (
              <button type="button" className={styles.removeButton} onClick={handleRemove} disabled={isLoading}>
                Quitar foto
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.hiddenInput}
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>

        <div className={styles.info}>
          <p className={styles.name}>{session.name ?? "—"}</p>
          <p className={styles.role}>{session.role === UserRole.TEACHER ? "Docente" : "Estudiante"}</p>
        </div>

        <div className={styles.notificationsBlock}>
          <h2 className={styles.notificationsTitle}>Notificaciones</h2>

          {notifications.permission === "unsupported" && (
            <p className={styles.notificationsHint}>Tu navegador no soporta notificaciones push.</p>
          )}

          {notifications.permission === "denied" && (
            <p className={styles.notificationsHint}>
              Bloqueaste las notificaciones para este sitio. Para activarlas, habilítalas desde la configuración de
              tu navegador.
            </p>
          )}

          {notifications.permission !== "unsupported" && notifications.permission !== "denied" && (
            <>
              {notifications.subscribed ? (
                <div className={styles.notificationsActive}>
                  <span className={styles.notificationsActiveLabel}>
                    <Bell size={16} aria-hidden="true" />
                    Notificaciones activadas
                  </span>
                  <button
                    type="button"
                    className={styles.notificationsToggleButton}
                    onClick={notifications.deactivate}
                    disabled={notifications.status === "requesting"}
                  >
                    <BellOff size={16} aria-hidden="true" />
                    Desactivar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.notificationsToggleButton}
                  onClick={notifications.activate}
                  disabled={notifications.status === "requesting"}
                >
                  <Bell size={16} aria-hidden="true" />
                  {notifications.status === "requesting" ? "Activando..." : "Activar notificaciones"}
                </button>
              )}
            </>
          )}

          {notifications.status === "error" && notifications.errorMessage && (
            <p role="alert" className={styles.notificationsError}>
              {notifications.errorMessage}
            </p>
          )}
        </div>

        {uiState.status === "error" && (
          <p role="alert" className={styles.error}>
            {uiState.message}
          </p>
        )}
        {uiState.status === "success" && (
          <p role="status" aria-live="polite" className={styles.success}>
            {uiState.message}
          </p>
        )}
      </div>

      {pendingCropFile && (
        <ProfilePhotoCropDialog file={pendingCropFile} onCancel={handleCropCancel} onConfirm={handleCropConfirm} />
      )}
    </AppShell>
  );
}