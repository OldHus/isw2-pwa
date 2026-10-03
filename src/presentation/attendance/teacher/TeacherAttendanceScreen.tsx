import { useEffect, useRef, useState, type FormEvent } from "react";
import { Copy, Download, Check, History } from "lucide-react";

import type { AttendanceSession } from "../../../domain/model/AttendanceModels";
import { useTeacherAttendanceViewModel } from "./useTeacherAttendanceViewModel";
import type { AttendanceEntry } from "./TeacherAttendanceUiState";
import styles from "./TeacherAttendanceScreen.module.scss";

interface TeacherAttendanceScreenProps {
  courseId: string;
}

export function TeacherAttendanceScreen({ courseId }: TeacherAttendanceScreenProps) {
  const { uiState, startSession, closeActiveSession, dismissExpiredSession, buildExportText } =
    useTeacherAttendanceViewModel(courseId);

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
      return <StartSessionForm onStart={startSession} />;

    case "active":
      return (
        <ActiveSessionView
          session={uiState.session}
          entries={uiState.entries}
          onExpired={closeActiveSession}
          onCloseManually={closeActiveSession}
          buildExportText={buildExportText}
        />
      );

    case "expired":
      return (
        <ExpiredSessionView
          session={uiState.session}
          entries={uiState.entries}
          onStartNew={dismissExpiredSession}
          buildExportText={buildExportText}
        />
      );
  }
}

function StartSessionForm({ onStart }: { onStart: (code: string, durationMinutes: number) => void }) {
  const [code, setCode] = useState("");
  const [duration, setDuration] = useState("5");

  const durationMinutes = Number.parseInt(duration, 10) || 0;
  const canSubmit = code.trim().length > 0 && durationMinutes > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onStart(code, durationMinutes);
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <h1 className={styles.formTitle}>Iniciar sesión de asistencia</h1>
      <p className={styles.formHint}>
        Escribe el código que vas a dictar en clase y por cuántos minutos estará activo.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="attendance-code">
          Código
        </label>
        <input
          id="attendance-code"
          className={styles.input}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="off"
          placeholder="Ej. CLASE07"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="attendance-duration">
          Duración (minutos)
        </label>
        <input
          id="attendance-duration"
          className={styles.input}
          value={duration}
          onChange={(event) => {
            const digitsOnly = event.target.value.replace(/\D/g, "");
            setDuration(digitsOnly);
          }}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      <button type="submit" className={styles.primaryButton} disabled={!canSubmit}>
        Activar código
      </button>
    </form>
  );
}

function RosterList({ entries }: { entries: AttendanceEntry[] }) {
  return (
    <div>
      <div className={styles.rosterHeader}>
        <h2 className={styles.rosterTitle}>Registrados</h2>
        <span className={styles.rosterCount}>{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p className={styles.rosterEmpty}>Todavía nadie ha registrado asistencia.</p>
      ) : (
        <ul className={styles.rosterList}>
          {entries.map((entry) => (
            <li className={styles.rosterRow} key={entry.studentEmail + entry.registeredAtMillis}>
              <span>
                <span className={styles.rosterName}>{entry.studentName}</span>{" "}
                <span className={styles.rosterEmail}>— {entry.studentEmail}</span>
              </span>
              <span className={styles.rosterTime}>
                {new Date(entry.registeredAtMillis).toLocaleTimeString("es-CO", { hour12: false })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExportActions({ buildExportText, fileNameSuffix }: { buildExportText: () => string; fileNameSuffix: string }) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  async function handleCopy() {
    const text = buildExportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Exception in paste
    }
  }

  function handleDownload() {
    const text = buildExportText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistencia-${fileNameSuffix}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button type="button" className={styles.outlinedButton} onClick={handleCopy}>
        {copyFeedback ? <Check size={16} /> : <Copy size={16} />}
        {copyFeedback ? "Copiado" : "Copiar"}
      </button>
      <button type="button" className={styles.outlinedButton} onClick={handleDownload}>
        <Download size={16} />
        Descargar .txt
      </button>
    </>
  );
}

interface ActiveSessionViewProps {
  session: AttendanceSession;
  entries: AttendanceEntry[];
  onExpired: () => void;
  onCloseManually: () => void;
  buildExportText: () => string;
}

function ActiveSessionView({
  session,
  entries,
  onExpired,
  onCloseManually,
  buildExportText,
}: ActiveSessionViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000))
  );
  const hasFiredExpiredRef = useRef(false);

  useEffect(() => {
    hasFiredExpiredRef.current = false;
    setRemainingSeconds(Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)));

    const interval = window.setInterval(() => {
      const next = Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0 && !hasFiredExpiredRef.current) {
        hasFiredExpiredRef.current = true;
        window.clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, session.expiresAt]);

  const totalSeconds = Math.max(1, Math.round(session.durationMinutes * 60));
  const progress = Math.min(1, remainingSeconds / totalSeconds);
  const isLow = remainingSeconds > 0 && remainingSeconds <= totalSeconds * 0.2;
  const isExpired = remainingSeconds <= 0;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className={styles.activeCard}>
      <div>
        <span className={styles.codeLabel}>Código activo</span>
        <div className={styles.codeBadge}>{session.code}</div>
      </div>

      <div className={styles.timerRow}>
        <span
          className={isExpired ? `${styles.timerText} ${styles.timerTextExpired}` : styles.timerText}
          role="status"
          aria-live="polite"
        >
          {isExpired ? "Expirado" : `Expira en ${minutes}:${seconds.toString().padStart(2, "0")}`}
        </span>
        <div className={styles.timerTrack}>
          <div
            className={isLow || isExpired ? `${styles.timerFill} ${styles.timerFillLow}` : styles.timerFill}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button type="button" className={styles.outlinedButton} onClick={onCloseManually}>
          Cerrar ahora
        </button>
        <ExportActions buildExportText={buildExportText} fileNameSuffix={session.code} />
      </div>

      <RosterList entries={entries} />
    </div>
  );
}

interface ExpiredSessionViewProps {
  session: AttendanceSession;
  entries: AttendanceEntry[];
  onStartNew: () => void;
  buildExportText: () => string;
}

function ExpiredSessionView({ session, entries, onStartNew, buildExportText }: ExpiredSessionViewProps) {
  return (
    <div className={styles.activeCard}>
      <div>
        <span className={styles.codeLabel}>Código finalizado</span>
        <div className={`${styles.codeBadge} ${styles.codeBadgeExpired}`}>{session.code}</div>
      </div>

      <div className={styles.expiredNotice}>
        <History size={16} aria-hidden="true" />
        <span>Esta sesión ya se cerró. Aquí queda el registro de quién alcanzó a marcar asistencia.</span>
      </div>

      <div className={styles.actionsRow}>
        <button type="button" className={styles.primaryButtonInline} onClick={onStartNew}>
          Iniciar nueva sesión
        </button>
        <ExportActions buildExportText={buildExportText} fileNameSuffix={session.code} />
      </div>

      <RosterList entries={entries} />
    </div>
  );
}