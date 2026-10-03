import type { PollError, PollVote } from "../model/PollModels";
import type { PollRepository } from "../repository/PollRepository";

export class ObserveMyVoteUseCase {
  private pollRepository: PollRepository;

  constructor(pollRepository: PollRepository) {
    this.pollRepository = pollRepository;
  }

  execute(
    courseId: string,
    pollId: string,
    onChange: (vote: PollVote | null) => void,
    onError?: (error: PollError) => void
  ): () => void {
    return this.pollRepository.observeMyVote(courseId, pollId, onChange, onError);
  }
}