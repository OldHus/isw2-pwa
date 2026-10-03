import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

import { useStudentAttendanceViewModel } from "./useStudentAttendanceViewModel";
import styles from "./StudentAttendanceScreen.module.scss";

interface StudentAttendanceScreenProps {
  courseId: string;
}

export function StudentAttendanceScreen({ courseId }: StudentAttendanceScreenProps) {
  const { uiState, submitCode } = useStudentAttendanceViewModel(courseId);

  switch (uiState.type) {
    case "loading":
      return (
        <div className={styles.centered} role="status" aria-live="polite">
          Cargando…
        </div>
      );

    case "error":
      return (
        <p className={styles.errorText} role="alert">
          {uiState.message}
        </p>
      );

    case "noActiveSession":
      return (
        <div className={styles.centered}>No hay una sesión de asistencia activa en este momento.</div>
      );

    case "alreadySubmitted":
      return (
        <div className={styles.successCard}>
          <CheckCircle2 size={40} className={styles.successIcon} aria-hidden="true" />
          <h1 className={styles.successTitle}>Ya registraste tu asistencia</h1>
          <span className={styles.successCode}>Código {uiState.session.code}</span>
        </div>
      );

    case "pendingInput":
      return <CodeInputForm errorMessage={uiState.errorMessage} onSubmit={submitCode} />;
  }
}

function CodeInputForm({
  errorMessage,
  onSubmit,
}: {
  errorMessage?: string;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    onSubmit(code);
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <h1 className={styles.formTitle}>Ingresa el código de asistencia</h1>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="student-attendance-code">
          Código
        </label>
        <input
          id="student-attendance-code"
          className={errorMessage ? `${styles.input} ${styles.inputError}` : styles.input}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="off"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "student-attendance-code-error" : undefined}
        />
        {errorMessage && (
          <span id="student-attendance-code-error" className={styles.fieldError} role="alert">
            {errorMessage}
          </span>
        )}
      </div>
      <button type="submit" className={styles.primaryButton} disabled={!code.trim()}>
        Registrar asistencia
      </button>
    </form>
  );
}