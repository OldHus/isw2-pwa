import type { Poll, PollOptionResult } from "../../../domain/model/PollModels";

export type StudentPollUiState =
  | { type: "loading" }
  | { type: "noPoll" }
  | {
      type: "result";
      poll: Poll;
      optionResults: PollOptionResult[];
      myOptionIndex: number | null;
    }
  | { type: "error"; message: string };