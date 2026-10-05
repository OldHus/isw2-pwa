import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useGradesMatrixViewModel } from "./hooks/useGradesMatrixViewModel";
import { Avatar } from "../../common/Avatar";
import { Routes, buildGradesStudentEditPath } from "../../../routes/Routes";
import styles from "./GradesMatrixScreen.module.scss";

const gradeFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function GradesMatrixScreen() {
  const { uiState, draft, errors, dirtyCount, hasErrors, saving, feedback, updateCell, saveAll, discard } =
    useGradesMatrixViewModel();
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className={styles.screen}>
        <Link to={Routes.grades} className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Calificaciones
        </Link>

        <h1 className={styles.title}>Matriz de calificaciones</h1>

        {feedback ? (
          <p role="status" aria-live="polite" className={styles.feedback}>
            {feedback}
          </p>
        ) : null}

        {uiState.status === "loading" && (
          <div className={styles.centered}>
            <div className={styles.spinner} aria-label="Cargando matriz" role="status" />
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
                  {dirtyCount === 0
                    ? "Sin cambios pendientes"
                    : dirtyCount === 1
                      ? "1 cambio pendiente"
                      : `${dirtyCount} cambios pendientes`}
                </span>
                <div className={styles.toolbarActions}>
                  <button
                    type="button"
                    className={styles.discardButton}
                    onClick={discard}
                    disabled={dirtyCount === 0 || saving}
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={saveAll}
                    disabled={dirtyCount === 0 || hasErrors || saving}
                  >
                    {saving ? "Guardando…" : `Guardar${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
                  </button>
                </div>
              </div>

              {hasErrors && (
                <p role="alert" className={styles.errorText}>
                  Revisa las celdas marcadas: las notas deben estar entre 0 y 5.
                </p>
              )}

              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.studentHeaderCell}>Estudiante</th>
                      {uiState.items.map((item) => (
                        <th key={item.id} className={styles.itemHeaderCell}>
                          {item.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uiState.students.map((student) => {
                      const studentGrades = uiState.grades[student.uid] ?? {};
                      const studentDraft = draft[student.uid] ?? {};
                      return (
                        <tr key={student.uid} className={styles.row}>
                          <th scope="row" className={styles.studentCell}>
                            <button
                              type="button"
                              className={styles.studentCellButton}
                              onClick={() => navigate(buildGradesStudentEditPath(student.uid))}
                            >
                              <span className={styles.studentCellContent}>
                                <Avatar
                                  photoUrl={student.photoUrl}
                                  role="estudiante"
                                  name={student.name || student.email}
                                  size={28}
                                />
                                {student.name || student.email}
                              </span>
                            </button>
                          </th>
                          {uiState.items.map((item) => {
                            const original = studentGrades[item.id];
                            const isEdited = item.id in studentDraft;
                            const displayValue = isEdited
                              ? studentDraft[item.id]
                              : original !== undefined
                                ? gradeFormatter.format(original)
                                : "";
                            const error = errors[`${student.uid}:${item.id}`];
                            return (
                              <td key={item.id} className={styles.gradeCell}>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className={`${styles.gradeInput} ${isEdited ? styles.gradeInputDirty : ""} ${error ? styles.gradeInputInvalid : ""}`}
                                  value={displayValue}
                                  placeholder="—"
                                  onChange={(event) => updateCell(student.uid, item.id, event.target.value)}
                                  aria-label={`Nota de ${student.name || student.email} en ${item.name}`}
                                  aria-invalid={error ? true : undefined}
                                  title={error ?? undefined}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ))}
      </div>
    </AppShell>
  );
}
