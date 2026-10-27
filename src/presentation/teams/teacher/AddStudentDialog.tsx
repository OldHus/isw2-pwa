import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { Avatar } from "../../common/Avatar";
import type { CourseStudent } from "../../../domain/model/CourseModels";
import styles from "./AddStudentDialog.module.scss";

interface AddStudentDialogProps {
  availableStudents: CourseStudent[];
  onDismiss: () => void;
  onSelect: (student: CourseStudent) => void;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function AddStudentDialog({ availableStudents, onDismiss, onSelect }: AddStudentDialogProps) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredStudents = useMemo(() => {
    const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return availableStudents;

    return availableStudents.filter((student) => {
      const haystack = normalizeSearchText(`${student.name} ${student.email}`);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [availableStudents, query]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      onDismiss();
    }
  }

  const hasQuery = query.trim().length > 0;

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
          <>
            <label className={styles.searchLabel} htmlFor="add-student-search">
              Buscar estudiante
            </label>
            <div className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
              <input
                ref={searchInputRef}
                id="add-student-search"
                type="search"
                className={styles.searchInput}
                placeholder="Buscar por nombre o correo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
              {hasQuery ? (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setQuery("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {hasQuery && filteredStudents.length > 0 ? (
              <p className={styles.resultCount} role="status" aria-live="polite">
                {filteredStudents.length === 1
                  ? "1 estudiante encontrado"
                  : `${filteredStudents.length} estudiantes encontrados`}
              </p>
            ) : null}

            {filteredStudents.length === 0 ? (
              <p className={styles.emptyState}>
                No se encontraron estudiantes para "{query.trim()}".
              </p>
            ) : (
              <ul className={styles.list}>
                {filteredStudents.map((student) => (
                  <li key={student.uid}>
                    <button
                      type="button"
                      className={styles.studentButton}
                      onClick={() => onSelect(student)}
                    >
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
          </>
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
