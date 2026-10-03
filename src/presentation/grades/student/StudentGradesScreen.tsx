import { GraduationCap } from "lucide-react";
import { AppShell } from "../../shell/AppShell";
import { useStudentGradesViewModel } from "./hooks/useStudentGradesViewModel";
import styles from "./StudentGradesScreen.module.scss";

const gradeFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function StudentGradesScreen() {
  const { uiState } = useStudentGradesViewModel();

  return (
    <AppShell>
      <div className={styles.screen}>
        <header className={styles.header}>
          <GraduationCap size={28} aria-hidden="true" />
          <h1 className={styles.title}>Calificaciones</h1>
        </header>

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
            <p className={styles.emptyState}>Aún no hay calificaciones definidas para este curso.</p>
          ) : (
            <ul className={styles.list}>
              {uiState.items.map((item) => {
                const hasGrade = item.id in uiState.grades;
                const grade = uiState.grades[item.id];

                return (
                  <li key={item.id} className={styles.row}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={hasGrade ? styles.gradeValue : styles.gradePending}>
                      {hasGrade ? gradeFormatter.format(grade) : "Pendiente"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}
      </div>
    </AppShell>
  );
}