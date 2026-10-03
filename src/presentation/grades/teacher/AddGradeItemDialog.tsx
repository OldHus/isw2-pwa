import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { GradeItemType, type GradeItemTypeValue } from "../../../domain/model/GradeModels";
import styles from "./AddGradeItemDialog.module.scss";

interface AddGradeItemDialogProps {
  onDismiss: () => void;
  onConfirm: (name: string, type: GradeItemTypeValue) => void;
}

export function AddGradeItemDialog({ onDismiss, onConfirm }: AddGradeItemDialogProps) {
  const [name, setName] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      onDismiss();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onConfirm(trimmed, isDynamic ? GradeItemType.DYNAMIC : GradeItemType.FIXED);
  }

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-grade-item-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="add-grade-item-title" className={styles.title}>
          Nuevo ítem de calificación
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
              required
            />
          </label>

          <label className={styles.switchRow}>
            <span>Tipo dinámico (quiz/tarea)</span>
            <input
              type="checkbox"
              role="switch"
              checked={isDynamic}
              onChange={(event) => setIsDynamic(event.target.checked)}
              aria-checked={isDynamic}
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onDismiss}>
              Cancelar
            </button>
            <button type="submit" className={styles.confirmButton} disabled={name.trim().length === 0}>
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}