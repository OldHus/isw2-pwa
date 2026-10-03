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

export function buildQuizLeaderboard(correctOptionIndex: number, answers: QuizAnswer[]): QuizLeaderboardEntry[] {
  return [...answers]
    .sort((a, b) => b.score - a.score || a.responseTimeMillis - b.responseTimeMillis)
    .map((answer, index) => ({
      rank: index + 1,
      studentUid: answer.studentUid,
      studentName: answer.studentName,
      selectedOptionIndex: answer.selectedOptionIndex,
      isCorrect: answer.selectedOptionIndex === correctOptionIndex,
      score: answer.score,
      responseTimeMillis: answer.responseTimeMillis,
    }));
}