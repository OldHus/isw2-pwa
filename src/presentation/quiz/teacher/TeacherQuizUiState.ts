import type { QuizQuestion, QuizSession, QuizStandingEntry } from "../../../domain/model/QuizModels";
import type { QuizLeaderboardEntry } from "../shared/buildQuizLeaderboard";

export type TeacherQuizUiState =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "content";
      bank: QuizQuestion[];
      activeSession: QuizSession | null;
      leaderboard: QuizLeaderboardEntry[];
      standing: QuizStandingEntry[];
    };