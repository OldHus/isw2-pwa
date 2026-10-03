import type { AppResult } from "../model/Result";
import type { QuizError } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class DeleteQuizQuestionUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(courseId: string, questionId: string): Promise<AppResult<void, QuizError>> {
    return this.quizRepository.deleteQuestion(courseId, questionId);
  }
}