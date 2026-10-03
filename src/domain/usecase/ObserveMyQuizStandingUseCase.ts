import type { QuizError, QuizStandingEntry } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class ObserveMyQuizStandingUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  execute(
    courseId: string,
    onChange: (entry: QuizStandingEntry | null) => void,
    onError?: (error: QuizError) => void
  ): () => void {
    return this.quizRepository.observeMyStanding(courseId, onChange, onError);
  }
}