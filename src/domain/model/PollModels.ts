
export interface Poll {
  id: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface PollVote {
  studentUid: string;
  studentName: string;
  optionIndex: number;
  votedAt: number;
}

export interface PollOptionResult {
  optionIndex: number;
  optionText: string;
  voterNames: string[];
}

export type PollError =
  | { type: "emptyQuestion" }
  | { type: "notEnoughOptions" }
  | { type: "invalidExpiration" }
  | { type: "noActivePoll" }
  | { type: "notAuthenticated" }
  | { type: "unknown"; message: string };