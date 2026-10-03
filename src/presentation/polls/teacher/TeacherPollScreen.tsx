import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import type { Poll, PollOptionResult } from "../../../domain/model/PollModels";
import { useTeacherPollViewModel } from "./useTeacherPollViewModel";
import { formatDateTime } from "../shared/formatDateTime";
import { formatRemaining } from "../shared/formatRemaining";
import styles from "./TeacherPollScreen.module.scss";

interface TeacherPollScreenProps {
  courseId: string;
}

export function TeacherPollScreen({ courseId }: TeacherPollScreenProps) {
  const { uiState, startPoll, closeActivePoll } = useTeacherPollViewModel(courseId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className={styles.wrapper}>
      <TeacherPollBody uiState={uiState} onExpired={closeActivePoll} onCloseManually={closeActivePoll} />

      <button
        type="button"
        className={styles.fab}
        onClick={() => setShowCreateDialog(true)}
        aria-label="Nueva encuesta"
      >
        <Plus size={22} aria-hidden="true" />
      </button>

      {showCreateDialog && (
        <CreatePollDialog
          onDismiss={() => setShowCreateDialog(false)}
          onConfirm={(question, options, expiresAtMillis) => {
            startPoll(question, options, expiresAtMillis);
            setShowCreateDialog(false);
          }}
        />
      )}
    </div>
  );
}

interface TeacherPollBodyProps {
  uiState: ReturnType<typeof useTeacherPollViewModel>["uiState"];
  onExpired: () => void;
  onCloseManually: () => void;
}

function TeacherPollBody({ uiState, onExpired, onCloseManually }: TeacherPollBodyProps) {
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
    case "noPoll":
      return (
        <p className={styles.centered}>
          Aún no has creado ninguna encuesta. Toca “Nueva encuesta” para lanzar la primera.
        </p>
      );
    case "result":
      return (
        <PollResultsView
          poll={uiState.poll}
          optionResults={uiState.optionResults}
          onExpired={onExpired}
          onCloseManually={onCloseManually}
        />
      );
  }
}

interface PollResultsViewProps {
  poll: Poll;
  optionResults: PollOptionResult[];
  onExpired: () => void;
  onCloseManually: () => void;
}

function PollResultsView({ poll, optionResults, onExpired, onCloseManually }: PollResultsViewProps) {
  const [remainingMillis, setRemainingMillis] = useState(() => Math.max(0, poll.expiresAt - Date.now()));
  const hasFiredExpiredRef = useRef(false);

  useEffect(() => {
    if (!poll.isActive) return;
    hasFiredExpiredRef.current = false;
    setRemainingMillis(Math.max(0, poll.expiresAt - Date.now()));

    const interval = window.setInterval(() => {
      const next = Math.max(0, poll.expiresAt - Date.now());
      setRemainingMillis(next);
      if (next <= 0 && !hasFiredExpiredRef.current) {
        hasFiredExpiredRef.current = true;
        window.clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id, poll.isActive]);

  return (
    <div className={styles.resultsCard}>
      <h2 className={styles.question}>{poll.question}</h2>
      <p className={styles.closesAt}>Cierra: {formatDateTime(poll.expiresAt)}</p>

      {poll.isActive ? (
        <div className={styles.activeRow}>
          <span className={styles.remaining} role="status" aria-live="polite">
            {formatRemaining(remainingMillis)}
          </span>
          <button type="button" className={styles.outlinedButton} onClick={onCloseManually}>
            Cerrar ahora
          </button>
        </div>
      ) : (
        <p className={styles.closedNotice}>Encuesta cerrada — resultados finales</p>
      )}

      <ul className={styles.optionList}>
        {optionResults.map((option) => (
          <li className={styles.optionCard} key={option.optionIndex}>
            <span className={styles.optionText}>
              {option.optionText} — {option.voterNames.length} voto(s)
            </span>
            {option.voterNames.length > 0 && (
              <span className={styles.voterNames}>{option.voterNames.join(", ")}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface CreatePollDialogProps {
  onDismiss: () => void;
  onConfirm: (question: string, options: string[], expiresAtMillis: number) => void;
}

function CreatePollDialog({ onDismiss, onConfirm }: CreatePollDialogProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresAtLocal, setExpiresAtLocal] = useState("");

  const trimmedOptionsCount = options.filter((option) => option.trim().length > 0).length;
  const parsedExpiresAt = expiresAtLocal ? new Date(expiresAtLocal).getTime() : null;
  const canSubmit =
    question.trim().length > 0 &&
    trimmedOptionsCount >= 2 &&
    parsedExpiresAt !== null &&
    !Number.isNaN(parsedExpiresAt) &&
    parsedExpiresAt > Date.now();

  function updateOption(index: number, value: string) {
    setOptions((previous) => previous.map((option, i) => (i === index ? value : option)));
  }

  function removeOption(index: number) {
    setOptions((previous) => previous.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (!canSubmit || parsedExpiresAt === null) return;
    onConfirm(question, options, parsedExpiresAt);
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-poll-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="create-poll-title" className={styles.dialogTitle}>
          Nueva encuesta
        </h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="poll-question">
            Pregunta
          </label>
          <input
            id="poll-question"
            className={styles.input}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.optionsFields}>
          {options.map((value, index) => (
            <div className={styles.optionRow} key={index}>
              <input
                className={`${styles.input} ${styles.optionInput}`}
                value={value}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Opción ${index + 1}`}
                autoComplete="off"
                aria-label={`Opción ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className={styles.removeOptionButton}
                  onClick={() => removeOption(index)}
                  aria-label={`Quitar opción ${index + 1}`}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className={styles.addOptionButton}
            onClick={() => setOptions((previous) => [...previous, ""])}
          >
            + Agregar opción
          </button>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="poll-expires-at">
            Fecha y hora de cierre
          </label>
          <input
            id="poll-expires-at"
            type="datetime-local"
            className={styles.input}
            value={expiresAtLocal}
            onChange={(event) => setExpiresAtLocal(event.target.value)}
          />
        </div>

        <div className={styles.dialogActions}>
          <button type="button" className={styles.outlinedButton} onClick={onDismiss}>
            Cancelar
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleConfirm} disabled={!canSubmit}>
            Lanzar
          </button>
        </div>
      </div>
    </div>
  );
}