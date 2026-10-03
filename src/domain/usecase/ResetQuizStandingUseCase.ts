import type { AppResult } from "../model/Result";
import type { QuizError } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class ResetQuizStandingUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(courseId: string): Promise<AppResult<void, QuizError>> {
    return this.quizRepository.resetCourseStanding(courseId);
  }
}