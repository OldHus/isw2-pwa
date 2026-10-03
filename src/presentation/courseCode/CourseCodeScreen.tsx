import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useCourseCodeViewModel } from "./hooks/useCourseCodeViewModel";
import styles from "./CourseCodeScreen.module.scss";

export function CourseCodeScreen() {
  const { uiState, isCheckingSession, onSubmitCode } = useCourseCodeViewModel();
  const [code, setCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = uiState.status === "loading";

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmitCode(code, photoFile);
  };

  if (isCheckingSession) {
    return (
      <div className={styles.screen}>
        <div className={styles.spinner} aria-label="Verificando sesión" role="status" />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <img src="/icon_trans.png" alt="" className={styles.logo} />
      <h1 className={styles.title}>Ingresa tu código de curso</h1>
      <p className={styles.subtitle}>
        Este código te lo compartió tu docente y determina a qué curso quedas inscrito. Solo se usa una vez.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="code">
          Código del curso
        </label>
        <input
          id="code"
          className={styles.input}
          type="text"
          placeholder="A3F9K2"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          disabled={isLoading}
          autoComplete="off"
          autoCapitalize="characters"
        />

        <div className={styles.photoSection}>
          <p className={styles.photoLabel}>Foto de perfil (opcional)</p>
          <div className={styles.photoRow}>
            {photoPreviewUrl ? (
              <img src={photoPreviewUrl} alt="" className={styles.photoPreview} />
            ) : (
              <div className={styles.photoPlaceholder} aria-hidden="true">
                <Camera size={20} />
              </div>
            )}
            <div className={styles.photoActions}>
              <button
                type="button"
                className={styles.photoButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {photoFile ? "Cambiar" : "Agregar foto"}
              </button>
              {photoFile && (
                <button
                  type="button"
                  className={styles.photoRemoveButton}
                  onClick={handleRemovePhoto}
                  disabled={isLoading}
                  aria-label="Quitar foto seleccionada"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <p className={styles.photoHint}>Puedes agregarla o cambiarla después desde "Mi perfil".</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.hiddenInput}
            onChange={handlePhotoChange}
            disabled={isLoading}
          />
        </div>

        <button className={styles.submitButton} type="submit" disabled={isLoading}>
          {isLoading ? "Verificando..." : "Continuar"}
        </button>
      </form>

      {uiState.status === "error" && (
        <p className={styles.error} role="alert" aria-live="polite">
          {uiState.message}
        </p>
      )}
    </div>
  );
}