import type { AppResult } from "../model/Result";
import type { QuizAnswer, QuizError, QuizQuestion, QuizSession, QuizStandingEntry } from "../model/QuizModels";

export interface QuizRepository {

  getQuestionBank(courseId: string): Promise<AppResult<QuizQuestion[], QuizError>>;

  createQuestion(
    courseId: string,
    text: string,
    options: string[],
    correctOptionIndex: number
  ): Promise<AppResult<QuizQuestion, QuizError>>;

  updateQuestion(
    courseId: string,
    questionId: string,
    text: string,
    options: string[],
    correctOptionIndex: number
  ): Promise<AppResult<void, QuizError>>;

  deleteQuestion(courseId: string, questionId: string): Promise<AppResult<void, QuizError>>;

  launchQuestion(
    courseId: string,
    question: QuizQuestion,
    durationSeconds: number
  ): Promise<AppResult<QuizSession, QuizError>>;

  closeSession(courseId: string, sessionId: string): Promise<AppResult<void, QuizError>>;

  observeLatestSession(
    courseId: string,
    onChange: (session: QuizSession | null) => void,
    onError?: (error: QuizError) => void
  ): () => void;

  observeSessionAnswers(
    courseId: string,
    sessionId: string,
    onChange: (answers: QuizAnswer[]) => void,
    onError?: (error: QuizError) => void
  ): () => void;

  submitAnswer(courseId: string, session: QuizSession, selectedOptionIndex: number): Promise<AppResult<void, QuizError>>;

  observeMyAnswer(
    courseId: string,
    sessionId: string,
    onChange: (answer: QuizAnswer | null) => void,
    onError?: (error: QuizError) => void
  ): () => void;

    observeCourseStanding(
    courseId: string,
    onChange: (standing: QuizStandingEntry[]) => void,
    onError?: (error: QuizError) => void
  ): () => void;

  observeMyStanding(
    courseId: string,
    onChange: (entry: QuizStandingEntry | null) => void,
    onError?: (error: QuizError) => void
  ): () => void;

  resetCourseStanding(courseId: string): Promise<AppResult<void, QuizError>>;
}