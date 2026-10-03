import type { QuizAnswer, QuizError } from "../model/QuizModels";
import type { QuizRepository } from "../repository/QuizRepository";

export class ObserveQuizSessionAnswersUseCase {
  private quizRepository: QuizRepository;

  constructor(quizRepository: QuizRepository) {
    this.quizRepository = quizRepository;
  }

  execute(
    courseId: string,
    sessionId: string,
    onChange: (answers: QuizAnswer[]) => void,
    onError?: (error: QuizError) => void
  ): () => void {
    return this.quizRepository.observeSessionAnswers(courseId, sessionId, onChange, onError);
  }
}