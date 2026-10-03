import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

import type { Poll, PollOptionResult } from "../../../domain/model/PollModels";
import { useStudentPollViewModel } from "./useStudentPollViewModel";
import { formatDateTime } from "../shared/formatDateTime";
import { formatRemaining } from "../shared/formatRemaining";
import styles from "./StudentPollScreen.module.scss";

interface StudentPollScreenProps {
  courseId: string;
}

export function StudentPollScreen({ courseId }: StudentPollScreenProps) {
  const { uiState, vote } = useStudentPollViewModel(courseId);

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
      return <p className={styles.centered}>No hay ninguna encuesta activa por ahora.</p>;
    case "result":
      return (
        <PollVotingView
          poll={uiState.poll}
          optionResults={uiState.optionResults}
          myOptionIndex={uiState.myOptionIndex}
          onVote={vote}
        />
      );
  }
}

interface PollVotingViewProps {
  poll: Poll;
  optionResults: PollOptionResult[];
  myOptionIndex: number | null;
  onVote: (optionIndex: number) => void;
}

function PollVotingView({ poll, optionResults, myOptionIndex, onVote }: PollVotingViewProps) {
  const [remainingMillis, setRemainingMillis] = useState(() => Math.max(0, poll.expiresAt - Date.now()));

  useEffect(() => {
    if (!poll.isActive) return;
    setRemainingMillis(Math.max(0, poll.expiresAt - Date.now()));

    const interval = window.setInterval(() => {
      const next = Math.max(0, poll.expiresAt - Date.now());
      setRemainingMillis(next);
      if (next <= 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id, poll.isActive]);

  const canVote = poll.isActive && Date.now() < poll.expiresAt;

  return (
    <div className={styles.votingCard}>
      <h2 className={styles.question}>{poll.question}</h2>
      <p className={styles.closesAt}>Cierra: {formatDateTime(poll.expiresAt)}</p>
      <p className={canVote ? styles.remaining : styles.closedNotice}>
        {canVote ? formatRemaining(remainingMillis) : "Encuesta cerrada"}
      </p>
      <p className={styles.hint}>
        {canVote
          ? "Toca una opción para votar. Puedes cambiar tu voto mientras esté activa."
          : "Esta encuesta ya cerró — resultados finales."}
      </p>

      <ul className={styles.optionList}>
        {optionResults.map((option) => {
          const isSelected = myOptionIndex === option.optionIndex;
          return (
            <li key={option.optionIndex}>
              <button
                type="button"
                className={isSelected ? `${styles.optionButton} ${styles.optionButtonSelected}` : styles.optionButton}
                onClick={() => onVote(option.optionIndex)}
                disabled={!canVote}
              >
                {isSelected ? (
                  <CheckCircle size={20} aria-hidden="true" />
                ) : (
                  <Circle size={20} aria-hidden="true" />
                )}
                <span className={styles.optionTextGroup}>
                  <span className={styles.optionText}>
                    {option.optionText} — {option.voterNames.length} voto(s)
                  </span>
                  {option.voterNames.length > 0 && (
                    <span className={styles.voterNames}>{option.voterNames.join(", ")}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}