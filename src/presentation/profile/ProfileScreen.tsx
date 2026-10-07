import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, BadgeCheck, Bell, BellOff } from "lucide-react";
import { AppShell } from "../shell/AppShell";
import { useProfileViewModel } from "./hooks/useProfileViewModel";
import { useCourseNotifications } from "./hooks/useCourseNotifications";
import { Avatar } from "../common/Avatar";
import { ProfilePhotoCropDialog } from "./ProfilePhotoCropDialog";
import { Particles } from "./shared/Particles";
import { TextReveal } from "./shared/TextReveal";
import { useTheme } from "../theme/ThemeContext";
import { UserRole } from "../../store/slices/sessionSlice";
import styles from "./ProfileScreen.module.scss";

export function ProfileScreen() {
  const { session, uiState, uploadPhoto, removePhoto } = useProfileViewModel();
  const notifications = useCourseNotifications();
  const { theme } = useTheme();
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
  const isTeacher = session.role === UserRole.TEACHER;

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
      <Particles
        className={styles.particlesFull}
        quantity={60}
        color={theme === "dark" ? "#4cc9f0" : "#0b84b8"}
      />
      <div className={styles.screen}>
        <div className={styles.cover} aria-hidden="true">
          <span className={styles.coverOrb1} />
          <span className={styles.coverOrb2} />
          <div className={styles.coverText}>
            <h1 className={styles.title}>Mi perfil</h1>
            <p className={styles.subtitle}>Tu identidad en el aula</p>
          </div>
        </div>

        <section className={`${styles.card} ${styles.identityCard}`} aria-label="Foto de perfil">
          <div className={styles.identityRow}>
            <span className={styles.avatarRing}>
              <Avatar photoUrl={displayUrl} role={session.role} name={session.name} size={96} />
            </span>
            <div className={styles.identityInfo}>
              <p className={styles.name}>
                <TextReveal text={session.name && session.name.trim() ? session.name : "—"} />
              </p>
              <span className={`${styles.roleBadge} ${isTeacher ? styles.roleTeacher : styles.roleStudent}`}>
                <BadgeCheck size={14} aria-hidden="true" />
                {isTeacher ? "Docente" : "Estudiante"}
              </span>
            </div>
          </div>

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
          <p className={styles.hint}>JPG · PNG · WEBP · máx 5 MB · con recorte</p>
        </section>

        <section className={styles.card} aria-labelledby="notifications-heading">
          <h2 id="notifications-heading" className={styles.cardTitle}>
            <Bell size={18} aria-hidden="true" />
            Notificaciones
          </h2>
          {notifications.subscribed ? (
            <button
              type="button"
              className={styles.notifyButton}
              onClick={notifications.deactivate}
              disabled={notifications.status === "requesting"}
            >
              <BellOff size={16} aria-hidden="true" />
              Desactivar notificaciones
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.notifyButton} ${styles.notifyPrimary}`}
              onClick={notifications.activate}
              disabled={notifications.status === "requesting"}
            >
              <Bell size={16} aria-hidden="true" />
              {notifications.status === "requesting" ? "Activando..." : "Activar notificaciones"}
            </button>
          )}
          {notifications.status === "error" && notifications.errorMessage && (
            <p role="alert" className={styles.notifyError}>
              {notifications.errorMessage}
            </p>
          )}
        </section>

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
