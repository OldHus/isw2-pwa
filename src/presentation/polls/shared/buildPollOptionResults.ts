import type { Poll, PollOptionResult, PollVote } from "../../../domain/model/PollModels";

export function buildPollOptionResults(poll: Poll, votes: PollVote[]): PollOptionResult[] {
  return poll.options.map((optionText, optionIndex) => ({
    optionIndex,
    optionText,
    voterNames: votes
      .filter((vote) => vote.optionIndex === optionIndex)
      .sort((a, b) => a.votedAt - b.votedAt)
      .map((vote) => vote.studentName),
  }));
}