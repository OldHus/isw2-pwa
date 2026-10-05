import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useStudentGradeEditViewModel } from "./hooks/useStudentGradeEditViewModel";
import { Avatar } from "../../common/Avatar";
import { FullScreenImageViewer } from "../../posts/shared/FullScreenImageViewer";
import { Routes } from "../../../routes/Routes";
import styles from "./StudentGradeEditScreen.module.scss";

interface ZoomedPhoto {
  url: string;
  originRect: DOMRect | null;
}

export function StudentGradeEditScreen() {
  const {
    uiState,
    feedback,
    draft,
    pendingForStudent,
    errors,
    dirtyCount,
    pendingCount,
    hasErrors,
    saving,
    updateValue,
    saveHere,
    stageAndContinue,
    discard,
  } = useStudentGradeEditViewModel();
  const navigate = useNavigate();

  const [zoomedPhoto, setZoomedPhoto] = useState<ZoomedPhoto | null>(null);

  const totalUnsaved = new Set([...Object.keys(draft), ...Object.keys(pendingForStudent)]).size;

  const handleContinue = () => {
    stageAndContinue();
    navigate(Routes.grades);
  };

  return (
    <AppShell>
      <div className={styles.screen}>
        <Link to={Routes.grades} className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Calificaciones
        </Link>

        <h1 className={styles.title}>Editar calificaciones</h1>

        {uiState.status === "success" && (
          <div className={styles.studentHeader}>
            {uiState.student.photoUrl ? (
              <button
                type="button"
                className={styles.avatarZoomTrigger}
                aria-label={`Ver foto de ${uiState.student.name || uiState.student.email} en grande`}
                onClick={(event) =>
                  setZoomedPhoto({
                    url: uiState.student.photoUrl as string,
                    originRect: event.currentTarget.getBoundingClientRect(),
                  })
                }
              >
                <Avatar
                  photoUrl={uiState.student.photoUrl}
                  role="estudiante"
                  name={uiState.student.name || uiState.student.email}
                  size={72}
                />
              </button>
            ) : (
              <Avatar
                photoUrl={uiState.student.photoUrl}
                role="estudiante"
                name={uiState.student.name || uiState.student.email}
                size={72}
              />
            )}
            <span className={styles.studentHeaderInfo}>
              <span className={styles.studentHeaderName}>
                {uiState.student.name || uiState.student.email}
              </span>
              <span className={styles.studentHeaderEmail}>{uiState.student.email}</span>
            </span>
          </div>
        )}

        {feedback ? (
          <p role="status" aria-live="polite" className={styles.feedback}>
            {feedback}
          </p>
        ) : null}

        {uiState.status === "loading" && (
          <div className={styles.centered}>
            <div className={styles.spinner} aria-label="Cargando calificaciones" role="status" />
          </div>
        )}

        {uiState.status === "error" && (
          <p role="alert" className={styles.errorText}>
            {uiState.message}
          </p>
        )}

        {uiState.status === "success" &&
          (uiState.items.length === 0 ? (
            <p className={styles.emptyState}>Aún no hay ítems de calificación definidos.</p>
          ) : (
            <>
              <div className={styles.toolbar} role="region" aria-label="Guardar cambios">
                <span className={styles.dirtyCount} aria-live="polite">
                  {totalUnsaved === 0
                    ? "Sin cambios pendientes"
                    : dirtyCount > 0 && pendingCount > 0
                      ? `${totalUnsaved} cambios (${pendingCount} pendientes)`
                      : pendingCount > 0 && dirtyCount === 0
                        ? `${pendingCount} pendientes de guardar`
                        : totalUnsaved === 1
                          ? "1 cambio pendiente"
                          : `${totalUnsaved} cambios pendientes`}
                </span>
                <div className={styles.toolbarActions}>
                  <button
                    type="button"
                    className={styles.discardButton}
                    onClick={discard}
                    disabled={totalUnsaved === 0 || saving}
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    className={styles.continueButton}
                    onClick={handleContinue}
                    disabled={hasErrors || saving || totalUnsaved === 0}
                  >
                    Seguir calificando
                  </button>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={saveHere}
                    disabled={totalUnsaved === 0 || hasErrors || saving}
                  >
                    {saving ? "Guardando…" : `Guardar aquí${totalUnsaved > 0 ? ` (${totalUnsaved})` : ""}`}
                  </button>
                </div>
              </div>

              {hasErrors && (
                <p role="alert" className={styles.errorText}>
                  Revisa las celdas marcadas: las notas deben estar entre 0 y 5.
                </p>
              )}

              <ul className={styles.list}>
                {uiState.items.map((item) => {
                  const original = uiState.grades[item.id];
                  const pending = pendingForStudent[item.id];
                  const hasPending = item.id in pendingForStudent;
                  const isEdited = item.id in draft || hasPending;
                  let displayValue: string;
                  if (item.id in draft) {
                    displayValue = draft[item.id];
                  } else if (hasPending) {
                    displayValue = pending === null ? "" : String(pending);
                  } else {
                    displayValue = original !== undefined ? String(original) : "";
                  }
                  const error = errors[item.id];
                  return (
                    <li key={item.id} className={styles.row}>
                      <span className={styles.itemName}>{item.name}</span>
                      <div className={styles.rowControls}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`${styles.gradeInput} ${isEdited ? styles.gradeInputDirty : ""} ${error ? styles.gradeInputInvalid : ""}`}
                          value={displayValue}
                          onChange={(event) => updateValue(item.id, event.target.value)}
                          aria-label={`Nota para ${item.name}`}
                          aria-invalid={error ? true : undefined}
                          title={error ?? "Vacía para eliminar la nota"}
                          placeholder="0,0"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className={styles.hint}>Vacía una celda y guarda para eliminar esa nota.</p>
            </>
          ))}
      </div>

      {zoomedPhoto && (
        <FullScreenImageViewer
          imageUrl={zoomedPhoto.url}
          originRect={zoomedPhoto.originRect}
          onDismiss={() => setZoomedPhoto(null)}
        />
      )}
    </AppShell>
  );
}
