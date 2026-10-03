import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { QuizStandingEntry } from "../../../domain/model/QuizModels";
import styles from "./QuizStandingList.module.scss";

const PREVIEW_COUNT = 5;

interface QuizStandingListProps {
  standing: QuizStandingEntry[];
  highlightedStudentUid?: string | null;
}

function rankClass(rank: number, totalScore: number): string {
  if (totalScore <= 0) return styles.rank;
  if (rank === 1) return `${styles.rank} ${styles.rankFirst}`;
  if (rank <= 3) return `${styles.rank} ${styles.rankPodium}`;
  return styles.rank;
}

export function QuizStandingList({ standing, highlightedStudentUid = null }: QuizStandingListProps) {
  const [showAll, setShowAll] = useState(false);

  const ranked = standing.map((entry) => ({
    entry,
    rank: standing.findIndex((other) => other.totalScore === entry.totalScore) + 1,
    isHighlighted: entry.studentUid === highlightedStudentUid,
  }));
  const canCollapse = ranked.length > PREVIEW_COUNT;
  const visible =
    canCollapse && !showAll ? ranked.filter((row, index) => index < PREVIEW_COUNT || row.isHighlighted) : ranked;

  return (
    <div className={styles.wrapper}>
      <ol className={styles.list}>
        {visible.map(({ entry, rank, isHighlighted }) => (
          <li className={isHighlighted ? `${styles.row} ${styles.rowHighlighted}` : styles.row} key={entry.studentUid}>
            <span className={rankClass(rank, entry.totalScore)}>{rank}</span>
            <span className={styles.name}>
              {entry.studentName}
              {isHighlighted && <span className={styles.youTag}> (tú)</span>}
            </span>
            <span className={entry.totalScore > 0 ? styles.score : `${styles.score} ${styles.scoreZero}`}>
              {entry.totalScore} pts
            </span>
          </li>
        ))}
      </ol>

      {canCollapse && (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setShowAll((previous) => !previous)}
          aria-expanded={showAll}
        >
          {showAll ? "Ver menos" : `Ver los ${standing.length} estudiantes`}
          {showAll ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}