import type { QuizError, QuizSession } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class ObserveLatestQuizSessionUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  execute(
    courseId: string,
    onChange: (session: QuizSession | null) => void,
    onError?: (error: QuizError) => void
  ): () => void {
    return this.quizRepository.observeLatestSession(courseId, onChange, onError);
  }
}