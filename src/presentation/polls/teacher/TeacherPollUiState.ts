import type { Poll, PollOptionResult } from "../../../domain/model/PollModels";

export type TeacherPollUiState =
  | { type: "loading" }
  | { type: "noPoll" }
  | { type: "result"; poll: Poll; optionResults: PollOptionResult[] }
  | { type: "error"; message: string };