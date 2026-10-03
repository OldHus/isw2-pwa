import type { QuizError, QuizStandingEntry } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class ObserveCourseQuizStandingUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  execute(
    courseId: string,
    onChange: (standing: QuizStandingEntry[]) => void,
    onError?: (error: QuizError) => void
  ): () => void {
    return this.quizRepository.observeCourseStanding(courseId, onChange, onError);
  }
}