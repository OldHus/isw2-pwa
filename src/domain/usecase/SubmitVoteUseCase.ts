import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { Poll, PollError } from "../model/PollModels";
import type { PollRepository } from "../repository/PollRepository";

export class SubmitVoteUseCase {
  private pollRepository: PollRepository;

  constructor(pollRepository: PollRepository) {
    this.pollRepository = pollRepository;
  }

  async execute(courseId: string, poll: Poll, optionIndex: number): Promise<AppResult<void, PollError>> {
    if (!poll.isActive || Date.now() > poll.expiresAt) {
      return failure({ type: "noActivePoll" });
    }
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return failure({ type: "unknown", message: "Opción inválida" });
    }
    return this.pollRepository.submitVote(courseId, poll.id, optionIndex);
  }
}