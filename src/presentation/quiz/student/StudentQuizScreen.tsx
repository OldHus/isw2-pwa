import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

import type { QuizAnswer, QuizSession, QuizStandingEntry } from "../../../domain/model/QuizModels";
import { QuizStandingList } from "../shared/QuizStandingList";
import { useStudentQuizViewModel } from "./useStudentQuizViewModel";
import styles from "./StudentQuizScreen.module.scss";

interface StudentQuizScreenProps {
  courseId: string;
}

export function StudentQuizScreen({ courseId }: StudentQuizScreenProps) {
  const { uiState, answer, myStanding, standing } = useStudentQuizViewModel(courseId);

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
    case "noActiveQuestion":
      return (
        <div className={styles.wrapper}>
          <MyStandingBadge standing={myStanding} />
          <p className={styles.centered}>No hay ninguna pregunta activa por ahora.</p>
          <CourseStandingCard standing={standing} myUid={myStanding?.studentUid ?? null} />
        </div>
      );
    case "question":
      return (
        <div className={styles.wrapper}>
          <MyStandingBadge standing={myStanding} />
          <QuestionView session={uiState.session} myAnswer={uiState.myAnswer} onAnswer={answer} />
          <CourseStandingCard standing={standing} myUid={myStanding?.studentUid ?? null} />
        </div>
      );
  }
}

interface MyStandingBadgeProps {
  standing: QuizStandingEntry | null;
}

function MyStandingBadge({ standing }: MyStandingBadgeProps) {
  return (
    <p className={styles.myStanding}>Tu puntaje acumulado: {standing?.totalScore ?? 0} pts</p>
  );
}

interface CourseStandingCardProps {
  standing: QuizStandingEntry[];
  myUid: string | null;
}

function CourseStandingCard({ standing, myUid }: CourseStandingCardProps) {
  if (standing.length === 0) return null;

  return (
    <div className={styles.standingCard}>
      <div className={styles.standingHeading}>
        <h2 className={styles.standingTitle}>Ranking acumulado del curso</h2>
        <p className={styles.standingCount}>
          {standing.length === 1 ? "1 estudiante" : `${standing.length} estudiantes`}
        </p>
      </div>
      <QuizStandingList standing={standing} highlightedStudentUid={myUid} />
    </div>
  );
}

interface QuestionViewProps {
  session: QuizSession;
  myAnswer: QuizAnswer | null;
  onAnswer: (optionIndex: number) => void;
}

function QuestionView({ session, myAnswer, onAnswer }: QuestionViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    if (!session.isActive) return;
    setRemainingSeconds(Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)));

    const interval = window.setInterval(() => {
      const next = Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, session.isActive]);

  const canAnswer = session.isActive && myAnswer === null && Date.now() < session.expiresAt;
  const revealResult = !session.isActive && myAnswer !== null;

  const statusText = canAnswer
    ? `Tiempo restante: ${remainingSeconds}s`
    : !session.isActive
    ? "Pregunta cerrada"
    : myAnswer !== null
    ? "Respuesta enviada — esperando cierre"
    : "Tiempo agotado";

  return (
    <div className={styles.questionCard}>
      <h2 className={styles.question}>{session.questionText}</h2>
      <p className={canAnswer ? styles.remaining : styles.statusNotice}>{statusText}</p>

      <ul className={styles.optionList}>
        {session.options.map((option, index) => {
          const isSelected = myAnswer?.selectedOptionIndex === index;
          const isCorrect = revealResult ? index === session.correctOptionIndex : null;
          return (
            <li key={index}>
              <OptionRow
                text={option}
                isSelected={isSelected}
                isCorrect={isCorrect}
                enabled={canAnswer}
                onClick={() => onAnswer(index)}
              />
            </li>
          );
        })}
      </ul>

      {revealResult && myAnswer && (
        <p className={styles.resultText}>
          {myAnswer.selectedOptionIndex === session.correctOptionIndex
            ? `¡Correcto! +${myAnswer.score} pts`
            : "Incorrecta — 0 pts"}
        </p>
      )}
    </div>
  );
}

interface OptionRowProps {
  text: string;
  isSelected: boolean;
  isCorrect: boolean | null;
  enabled: boolean;
  onClick: () => void;
}

function OptionRow({ text, isSelected, isCorrect, enabled, onClick }: OptionRowProps) {
  let variantClass = styles.optionButton;
  if (isCorrect === true) {
    variantClass = `${styles.optionButton} ${styles.optionButtonCorrect}`;
  } else if (isCorrect === false && isSelected) {
    variantClass = `${styles.optionButton} ${styles.optionButtonWrong}`;
  } else if (isSelected) {
    variantClass = `${styles.optionButton} ${styles.optionButtonSelected}`;
  }

  return (
    <button type="button" className={variantClass} onClick={onClick} disabled={!enabled}>
      {isCorrect !== null &&
        (isCorrect ? <CheckCircle size={20} aria-hidden="true" /> : <XCircle size={20} aria-hidden="true" />)}
      <span className={styles.optionText}>{text}</span>
    </button>
  );
}