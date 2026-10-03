import type { AppResult } from "../model/Result";
import type { PollError } from "../model/PollModels";
import type { PollRepository } from "../repository/PollRepository";

export class ClosePollUseCase {
  private pollRepository: PollRepository;

  constructor(pollRepository: PollRepository) {
    this.pollRepository = pollRepository;
  }

  async execute(courseId: string, pollId: string): Promise<AppResult<void, PollError>> {
    return this.pollRepository.closePoll(courseId, pollId);
  }
}