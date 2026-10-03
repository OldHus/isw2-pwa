import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { QuizError, QuizSession } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class SubmitQuizAnswerUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(
    courseId: string,
    session: QuizSession,
    selectedOptionIndex: number
  ): Promise<AppResult<void, QuizError>> {
    if (selectedOptionIndex < 0 || selectedOptionIndex >= session.options.length) {
      return failure({ type: "invalidOption" });
    }
    if (!session.isActive) {
      return failure({ type: "sessionClosed" });
    }
    return this.quizRepository.submitAnswer(courseId, session, selectedOptionIndex);
  }
}