
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  createdAt: number;
}

export interface QuizSession {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  durationSeconds: number;
  isActive: boolean;
  launchedAt: number;
  expiresAt: number;
}

export interface QuizAnswer {
  studentUid: string;
  studentName: string;
  selectedOptionIndex: number;
  responseTimeMillis: number;
  score: number;
  answeredAt: number;
}


export interface QuizStandingEntry {
  studentUid: string;
  studentName: string;
  totalScore: number;
}

export type QuizError =
  | { type: "emptyQuestionText" }
  | { type: "notEnoughOptions" }
  | { type: "invalidCorrectOption" }
  | { type: "invalidDuration" }
  | { type: "noActiveSession" }
  | { type: "sessionClosed" }
  | { type: "invalidOption" }
  | { type: "alreadyAnswered" }
  | { type: "unknown"; message: string };