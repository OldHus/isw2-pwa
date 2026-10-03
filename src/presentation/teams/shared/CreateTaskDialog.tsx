import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import styles from "./TeamNameDialog.module.scss";

interface CreateTaskDialogProps {
  title: string;
  confirmLabel: string;
  onDismiss: () => void;
  onConfirm: (title: string, description: string) => void;
}

export function CreateTaskDialog({ title, confirmLabel, onDismiss, onConfirm }: CreateTaskDialogProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      onDismiss();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = taskTitle.trim();
    if (trimmed.length === 0) return;
    onConfirm(trimmed, description.trim());
  }

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="create-task-dialog-title" className={styles.title}>
          {title}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Título</span>
            <input
              ref={titleInputRef}
              type="text"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              autoComplete="off"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Descripción (opcional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onDismiss}>
              Cancelar
            </button>
            <button type="submit" className={styles.confirmButton} disabled={taskTitle.trim().length === 0}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}