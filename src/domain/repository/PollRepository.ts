import type { AppResult } from "../model/Result";
import type { Poll, PollError, PollVote } from "../model/PollModels";

export interface PollRepository {
  //Teacher

  startPoll(
    courseId: string,
    question: string,
    options: string[],
    expiresAtMillis: number
  ): Promise<AppResult<Poll, PollError>>;

  closePoll(courseId: string, pollId: string): Promise<AppResult<void, PollError>>;

  //Shared

  observeLatestPoll(
    courseId: string,
    onChange: (poll: Poll | null) => void,
    onError?: (error: PollError) => void
  ): () => void;

  observePollVotes(
    courseId: string,
    pollId: string,
    onChange: (votes: PollVote[]) => void,
    onError?: (error: PollError) => void
  ): () => void;

  //Student

  submitVote(courseId: string, pollId: string, optionIndex: number): Promise<AppResult<void, PollError>>;

  observeMyVote(
    courseId: string,
    pollId: string,
    onChange: (vote: PollVote | null) => void,
    onError?: (error: PollError) => void
  ): () => void;
}