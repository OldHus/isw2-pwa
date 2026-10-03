import type { AppResult } from "../model/Result";
import type { QuizError, QuizQuestion } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class GetQuestionBankUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(courseId: string): Promise<AppResult<QuizQuestion[], QuizError>> {
    return this.quizRepository.getQuestionBank(courseId);
  }
}