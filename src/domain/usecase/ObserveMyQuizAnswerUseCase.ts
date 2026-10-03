import type { QuizAnswer, QuizError } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class ObserveMyQuizAnswerUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  execute(
    courseId: string,
    sessionId: string,
    onChange: (answer: QuizAnswer | null) => void,
    onError?: (error: QuizError) => void
  ): () => void {
    return this.quizRepository.observeMyAnswer(courseId, sessionId, onChange, onError);
  }
}