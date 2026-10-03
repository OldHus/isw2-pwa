import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { Poll, PollError } from "../model/PollModels";
import type { PollRepository } from "../repository/PollRepository";

export class StartPollUseCase {
  private pollRepository: PollRepository;

  constructor(pollRepository: PollRepository) {
    this.pollRepository = pollRepository;
  }

  async execute(
    courseId: string,
    question: string,
    options: string[],
    expiresAtMillis: number
  ): Promise<AppResult<Poll, PollError>> {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return failure({ type: "emptyQuestion" });
    }

    const trimmedOptions = options.map((option) => option.trim()).filter((option) => option.length > 0);
    if (trimmedOptions.length < 2) {
      return failure({ type: "notEnoughOptions" });
    }

    if (expiresAtMillis <= Date.now()) {
      return failure({ type: "invalidExpiration" });
    }

    return this.pollRepository.startPoll(courseId, trimmedQuestion, trimmedOptions, expiresAtMillis);
  }
}