import type { KeyboardEvent } from "react";
import { Avatar } from "../../common/Avatar";
import type { CourseStudent } from "../../../domain/model/CourseModels";
import styles from "./AddStudentDialog.module.scss";

interface AddStudentDialogProps {
  availableStudents: CourseStudent[];
  onDismiss: () => void;
  onSelect: (student: CourseStudent) => void;
}

export function AddStudentDialog({ availableStudents, onDismiss, onSelect }: AddStudentDialogProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      onDismiss();
    }
  }

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="add-student-dialog-title" className={styles.title}>
          Agregar estudiante
        </h2>

        {availableStudents.length === 0 ? (
          <p className={styles.emptyState}>No hay estudiantes disponibles para agregar.</p>
        ) : (
          <ul className={styles.list}>
            {availableStudents.map((student) => (
              <li key={student.uid}>
                <button type="button" className={styles.studentButton} onClick={() => onSelect(student)}>
                  <Avatar
                    photoUrl={student.photoUrl}
                    role="estudiante"
                    name={student.name || student.email}
                    size={32}
                  />
                  <span className={styles.studentName}>{student.name || student.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.closeRow}>
          <button type="button" className={styles.closeButton} onClick={onDismiss}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}