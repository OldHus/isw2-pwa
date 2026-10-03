import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { QuizError, QuizQuestion } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class CreateQuizQuestionUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(
    courseId: string,
    text: string,
    options: string[],
    correctOptionIndex: number
  ): Promise<AppResult<QuizQuestion, QuizError>> {
    if (text.trim().length === 0) {
      return failure({ type: "emptyQuestionText" });
    }
    if (options.filter((option) => option.trim().length > 0).length < 2) {
      return failure({ type: "notEnoughOptions" });
    }
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      return failure({ type: "invalidCorrectOption" });
    }
    return this.quizRepository.createQuestion(courseId, text, options, correctOptionIndex);
  }
}