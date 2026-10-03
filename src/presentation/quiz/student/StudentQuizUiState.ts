import type { QuizAnswer, QuizSession } from "../../../domain/model/QuizModels";

export type StudentQuizUiState =
  | { type: "loading" }
  | { type: "noActiveQuestion" }
  | { type: "question"; session: QuizSession; myAnswer: QuizAnswer | null }
  | { type: "error"; message: string };