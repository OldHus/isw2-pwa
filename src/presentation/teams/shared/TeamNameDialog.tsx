import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import styles from "./TeamNameDialog.module.scss";

interface TeamNameDialogProps {
  title: string;
  fieldLabel: string;
  confirmLabel: string;
  initialName?: string;
  onDismiss: () => void;
  onConfirm: (name: string) => void;
}

export function TeamNameDialog({
  title,
  fieldLabel,
  confirmLabel,
  initialName,
  onDismiss,
  onConfirm,
}: TeamNameDialogProps) {
  const [name, setName] = useState(initialName ?? "");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
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
    onConfirm(trimmed);
  }

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-name-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="team-name-dialog-title" className={styles.title}>
          {title}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{fieldLabel}</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
              required
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onDismiss}>
              Cancelar
            </button>
            <button type="submit" className={styles.confirmButton} disabled={name.trim().length === 0}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}