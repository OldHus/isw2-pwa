import type { QuizAnswer } from "../../../domain/model/QuizModels";

export interface QuizLeaderboardEntry {
  rank: number;
  studentUid: string;
  studentName: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  score: number;
  responseTimeMillis: number;
}

function resolveIsCorrect(answer: QuizAnswer, correctOptionIndex: number | null): boolean | null {
  if (answer.isCorrect !== null) return answer.isCorrect;
  if (correctOptionIndex !== null) return answer.selectedOptionIndex === correctOptionIndex;
  return null;
}

export function buildQuizLeaderboard(correctOptionIndex: number | null, answers: QuizAnswer[]): QuizLeaderboardEntry[] {
  return answers
    .map((answer) => ({ answer, isCorrect: resolveIsCorrect(answer, correctOptionIndex) }))
    .filter((graded): graded is { answer: QuizAnswer; isCorrect: boolean } => graded.isCorrect !== null)
    .sort((a, b) => b.answer.score - a.answer.score || a.answer.responseTimeMillis - b.answer.responseTimeMillis)
    .map(({ answer, isCorrect }, index) => ({
      rank: index + 1,
      studentUid: answer.studentUid,
      studentName: answer.studentName,
      selectedOptionIndex: answer.selectedOptionIndex,
      isCorrect,
      score: answer.score,
      responseTimeMillis: answer.responseTimeMillis,
    }));
}