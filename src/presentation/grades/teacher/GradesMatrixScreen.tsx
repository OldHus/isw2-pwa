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
  const { uiState } = useGradesMatrixViewModel();
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className={styles.screen}>
        <Link to={Routes.grades} className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Calificaciones
        </Link>

        <h1 className={styles.title}>Matriz de calificaciones</h1>

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
                          const hasGrade = item.id in studentGrades;
                          return (
                            <td key={item.id} className={styles.gradeCell}>
                              {hasGrade ? gradeFormatter.format(studentGrades[item.id]) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </AppShell>
  );
}