import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { QuizError } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class UpdateQuizQuestionUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(
    courseId: string,
    questionId: string,
    text: string,
    options: string[],
    correctOptionIndex: number
  ): Promise<AppResult<void, QuizError>> {
    if (text.trim().length === 0) {
      return failure({ type: "emptyQuestionText" });
    }
    if (options.filter((option) => option.trim().length > 0).length < 2) {
      return failure({ type: "notEnoughOptions" });
    }
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      return failure({ type: "invalidCorrectOption" });
    }
    return this.quizRepository.updateQuestion(courseId, questionId, text, options, correctOptionIndex);
  }
}