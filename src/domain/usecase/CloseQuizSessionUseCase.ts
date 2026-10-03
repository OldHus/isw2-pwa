import type { AppResult } from "../model/Result";
import type { QuizError } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class CloseQuizSessionUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(courseId: string, sessionId: string): Promise<AppResult<void, QuizError>> {
    return this.quizRepository.closeSession(courseId, sessionId);
  }
}