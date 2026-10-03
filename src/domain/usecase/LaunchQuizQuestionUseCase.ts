import { failure } from "../model/Result";
import type { AppResult } from "../model/Result";
import type { QuizError, QuizQuestion, QuizSession } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

const MAX_DURATION_SECONDS = 300;

export class LaunchQuizQuestionUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  async execute(
    courseId: string,
    question: QuizQuestion,
    durationSeconds: number
  ): Promise<AppResult<QuizSession, QuizError>> {
    if (durationSeconds < 1 || durationSeconds > MAX_DURATION_SECONDS) {
      return failure({ type: "invalidDuration" });
    }
    return this.quizRepository.launchQuestion(courseId, question, durationSeconds);
  }
}