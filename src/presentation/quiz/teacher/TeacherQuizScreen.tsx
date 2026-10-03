import { useEffect, useRef, useState } from "react";
import { Plus, X, Play, Pencil, Trash2, RotateCcw } from "lucide-react";

import type { QuizQuestion, QuizSession, QuizStandingEntry } from "../../../domain/model/QuizModels";
import type { QuizLeaderboardEntry } from "../shared/buildQuizLeaderboard";
import { QuizStandingList } from "../shared/QuizStandingList";
import { useTeacherQuizViewModel } from "./useTeacherQuizViewModel";
import styles from "./TeacherQuizScreen.module.scss";

const DEFAULT_DURATION_SECONDS = 20;
const MAX_DURATION_SECONDS = 300;

interface TeacherQuizScreenProps {
  courseId: string;
}

export function TeacherQuizScreen({ courseId }: TeacherQuizScreenProps) {
  const { uiState, createQuestion, updateQuestion, deleteQuestion, launchQuestion, closeActiveSession, resetStanding } =
    useTeacherQuizViewModel(courseId);

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [launchingQuestion, setLaunchingQuestion] = useState<QuizQuestion | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className={styles.wrapper}>
      <TeacherQuizBody
        uiState={uiState}
        onExpired={closeActiveSession}
        onCloseManually={closeActiveSession}
        onEdit={(question) => {
          setEditingQuestion(question);
          setShowQuestionDialog(true);
        }}
        onDelete={deleteQuestion}
        onLaunch={(question) => setLaunchingQuestion(question)}
        onRequestReset={() => setShowResetConfirm(true)}
      />

      {showResetConfirm && (
        <ConfirmResetDialog
          onDismiss={() => setShowResetConfirm(false)}
          onConfirm={() => {
            resetStanding();
            setShowResetConfirm(false);
          }}
        />
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => {
          setEditingQuestion(null);
          setShowQuestionDialog(true);
        }}
        aria-label="Nueva pregunta"
      >
        <Plus size={22} aria-hidden="true" />
      </button>

      {showQuestionDialog && (
        <QuestionFormDialog
          initial={editingQuestion}
          onDismiss={() => setShowQuestionDialog(false)}
          onConfirm={(text, options, correctIndex) => {
            if (editingQuestion) {
              updateQuestion(editingQuestion.id, text, options, correctIndex);
            } else {
              createQuestion(text, options, correctIndex);
            }
            setShowQuestionDialog(false);
          }}
        />
      )}

      {launchingQuestion && (
        <LaunchQuestionDialog
          question={launchingQuestion}
          onDismiss={() => setLaunchingQuestion(null)}
          onConfirm={(durationSeconds) => {
            launchQuestion(launchingQuestion, durationSeconds);
            setLaunchingQuestion(null);
          }}
        />
      )}
    </div>
  );
}

interface TeacherQuizBodyProps {
  uiState: ReturnType<typeof useTeacherQuizViewModel>["uiState"];
  onExpired: () => void;
  onCloseManually: () => void;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (questionId: string) => void;
  onLaunch: (question: QuizQuestion) => void;
  onRequestReset: () => void;
}

function TeacherQuizBody({
  uiState,
  onExpired,
  onCloseManually,
  onEdit,
  onDelete,
  onLaunch,
  onRequestReset,
}: TeacherQuizBodyProps) {
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
    case "content":
      return (
        <div className={styles.content}>
          <CourseStandingPanel standing={uiState.standing} onRequestReset={onRequestReset} />

          {uiState.activeSession && (
            <ActiveSessionPanel
              session={uiState.activeSession}
              leaderboard={uiState.leaderboard}
              onExpired={onExpired}
              onCloseManually={onCloseManually}
            />
          )}

          <div className={styles.bankSection}>
            <h2 className={styles.bankTitle}>Banco de preguntas</h2>
            {uiState.bank.length === 0 ? (
              <p className={styles.centered}>
                Aún no has creado ninguna pregunta. Toca “Nueva pregunta” para agregar la primera.
              </p>
            ) : (
              <ul className={styles.bankList}>
                {uiState.bank.map((question) => (
                  <li key={question.id}>
                    <QuestionBankCard
                      question={question}
                      onEdit={() => onEdit(question)}
                      onDelete={() => onDelete(question.id)}
                      onLaunch={() => onLaunch(question)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
  }
}

interface ActiveSessionPanelProps {
  session: QuizSession;
  leaderboard: QuizLeaderboardEntry[];
  onExpired: () => void;
  onCloseManually: () => void;
}

function ActiveSessionPanel({ session, leaderboard, onExpired, onCloseManually }: ActiveSessionPanelProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000))
  );
  const hasFiredExpiredRef = useRef(false);

  useEffect(() => {
    if (!session.isActive) return;
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
  }, [session.id, session.isActive]);

  return (
    <div className={styles.sessionCard}>
      <h2 className={styles.question}>{session.questionText}</h2>

      {session.isActive ? (
        <div className={styles.activeRow}>
          <span className={styles.remaining} role="status" aria-live="polite">
            Tiempo restante: {remainingSeconds}s
          </span>
          <button type="button" className={styles.outlinedButton} onClick={onCloseManually}>
            Cerrar ahora
          </button>
        </div>
      ) : (
        <p className={styles.closedNotice}>Pregunta cerrada — resultados finales</p>
      )}

      <div className={styles.leaderboardSection}>
        <h3 className={styles.leaderboardTitle}>Ranking</h3>
        {leaderboard.length === 0 ? (
          <p className={styles.leaderboardEmpty}>Nadie ha respondido todavía.</p>
        ) : (
          <ul className={styles.leaderboardList}>
            {leaderboard.map((entry) => (
              <li className={styles.leaderboardRow} key={entry.studentUid}>
                <span className={entry.isCorrect ? styles.leaderboardName : styles.leaderboardNameWrong}>
                  {entry.rank}. {entry.studentName}
                  {!entry.isCorrect && " (incorrecta)"}
                </span>
                <span className={styles.leaderboardScore}>{entry.score} pts</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface CourseStandingPanelProps {
  standing: QuizStandingEntry[];
  onRequestReset: () => void;
}

function CourseStandingPanel({ standing, onRequestReset }: CourseStandingPanelProps) {
  const studentCountLabel = standing.length === 1 ? "1 estudiante" : `${standing.length} estudiantes`;

  return (
    <div className={styles.standingCard}>
      <div className={styles.standingHeader}>
        <div className={styles.standingHeading}>
          <h2 className={styles.standingTitle}>Ranking acumulado del curso</h2>
          {standing.length > 0 && <p className={styles.standingCount}>{studentCountLabel}</p>}
        </div>
        <button
          type="button"
          className={styles.resetButton}
          onClick={onRequestReset}
          disabled={standing.length === 0}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reiniciar
        </button>
      </div>

      {standing.length === 0 ? (
        <p className={styles.standingEmpty}>Todavía no hay puntos acumulados en este curso.</p>
      ) : (
        <QuizStandingList standing={standing} />
      )}
    </div>
  );
}

interface ConfirmResetDialogProps {
  onDismiss: () => void;
  onConfirm: () => void;
}

function ConfirmResetDialog({ onDismiss, onConfirm }: ConfirmResetDialogProps) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-standing-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="reset-standing-title" className={styles.dialogTitle}>
          ¿Reiniciar el ranking acumulado?
        </h2>
        <p className={styles.dialogHint}>
          Esto elimina todas las preguntas lanzadas y las respuestas de los estudiantes, y el ranking queda
          vacío. No se puede deshacer. Tu banco de preguntas no se borra.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.outlinedButton} onClick={onDismiss}>
            Cancelar
          </button>
          <button type="button" className={styles.dangerButton} onClick={onConfirm}>
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}

interface QuestionBankCardProps {
  question: QuizQuestion;
  onEdit: () => void;
  onDelete: () => void;
  onLaunch: () => void;
}

function QuestionBankCard({ question, onEdit, onDelete, onLaunch }: QuestionBankCardProps) {
  return (
    <div className={styles.bankCard}>
      <p className={styles.bankQuestionText}>{question.text}</p>
      <ul className={styles.bankOptionList}>
        {question.options.map((option, index) => (
          <li
            key={index}
            className={index === question.correctOptionIndex ? styles.bankOptionCorrect : styles.bankOption}
          >
            {index === question.correctOptionIndex ? "✓ " : "· "}
            {option}
          </li>
        ))}
      </ul>
      <div className={styles.bankActions}>
        <button type="button" className={styles.launchButton} onClick={onLaunch}>
          <Play size={16} aria-hidden="true" />
          Lanzar
        </button>
        <button type="button" className={styles.iconButton} onClick={onEdit} aria-label="Editar pregunta">
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button type="button" className={styles.iconButton} onClick={onDelete} aria-label="Eliminar pregunta">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

interface QuestionFormDialogProps {
  initial: QuizQuestion | null;
  onDismiss: () => void;
  onConfirm: (text: string, options: string[], correctOptionIndex: number) => void;
}

function QuestionFormDialog({ initial, onDismiss, onConfirm }: QuestionFormDialogProps) {
  const [text, setText] = useState(initial?.text ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctOptionIndex ?? 0);

  const canSubmit =
    text.trim().length > 0 &&
    options.filter((option) => option.trim().length > 0).length >= 2 &&
    correctIndex >= 0 &&
    correctIndex < options.length &&
    options[correctIndex].trim().length > 0;

  function updateOption(index: number, value: string) {
    setOptions((previous) => previous.map((option, i) => (i === index ? value : option)));
  }

  function removeOption(index: number) {
    setOptions((previous) => {
      const next = previous.filter((_, i) => i !== index);
      if (correctIndex >= next.length) setCorrectIndex(0);
      return next;
    });
  }

  function handleConfirm() {
    if (!canSubmit) return;
    onConfirm(text, options, correctIndex);
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-question-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="quiz-question-title" className={styles.dialogTitle}>
          {initial ? "Editar pregunta" : "Nueva pregunta"}
        </h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="quiz-question-text">
            Pregunta
          </label>
          <input
            id="quiz-question-text"
            className={styles.input}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.optionsFields}>
          {options.map((value, index) => (
            <div className={styles.optionRow} key={index}>
              <input
                type="radio"
                name="quiz-correct-option"
                className={styles.radio}
                checked={correctIndex === index}
                onChange={() => setCorrectIndex(index)}
                aria-label={`Marcar opción ${index + 1} como correcta`}
              />
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

        <p className={styles.dialogHint}>Marca con el punto cuál opción es la respuesta correcta.</p>

        <div className={styles.dialogActions}>
          <button type="button" className={styles.outlinedButton} onClick={onDismiss}>
            Cancelar
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleConfirm} disabled={!canSubmit}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

interface LaunchQuestionDialogProps {
  question: QuizQuestion;
  onDismiss: () => void;
  onConfirm: (durationSeconds: number) => void;
}

function LaunchQuestionDialog({ question, onDismiss, onConfirm }: LaunchQuestionDialogProps) {
  const [durationText, setDurationText] = useState(String(DEFAULT_DURATION_SECONDS));
  const durationSeconds = Number.parseInt(durationText, 10);
  const canSubmit =
    durationText.length > 0 &&
    Number.isFinite(durationSeconds) &&
    durationSeconds >= 1 &&
    durationSeconds <= MAX_DURATION_SECONDS;

  return (
    <div className={styles.overlay} role="presentation" onClick={onDismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-question-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="launch-question-title" className={styles.dialogTitle}>
          Lanzar pregunta
        </h2>
        <p className={styles.launchQuestionText}>{question.text}</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="quiz-duration">
            Duración (segundos, máx. {MAX_DURATION_SECONDS})
          </label>
          <input
            id="quiz-duration"
            className={styles.input}
            value={durationText}
            onChange={(event) => setDurationText(event.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className={styles.dialogActions}>
          <button type="button" className={styles.outlinedButton} onClick={onDismiss}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => canSubmit && onConfirm(durationSeconds)}
            disabled={!canSubmit}
          >
            Lanzar
          </button>
        </div>
      </div>
    </div>
  );
}