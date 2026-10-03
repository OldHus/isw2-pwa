import type { Poll, PollError } from "../model/PollModels";
import type { PollRepository } from "../repository/PollRepository";

export class ObserveLatestPollUseCase {
  private pollRepository: PollRepository;

  constructor(pollRepository: PollRepository) {
    this.pollRepository = pollRepository;
  }

  execute(
    courseId: string,
    onChange: (poll: Poll | null) => void,
    onError?: (error: PollError) => void
  ): () => void {
    return this.pollRepository.observeLatestPoll(courseId, onChange, onError);
  }
}