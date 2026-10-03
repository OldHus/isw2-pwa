import type { PollError, PollVote } from "../model/PollModels";
import type { PollRepository } from "../repository/PollRepository";

export class ObservePollVotesUseCase {
  private pollRepository: PollRepository;

  constructor(pollRepository: PollRepository) {
    this.pollRepository = pollRepository;
  }

  execute(
    courseId: string,
    pollId: string,
    onChange: (votes: PollVote[]) => void,
    onError?: (error: PollError) => void
  ): () => void {
    return this.pollRepository.observePollVotes(courseId, pollId, onChange, onError);
  }
}