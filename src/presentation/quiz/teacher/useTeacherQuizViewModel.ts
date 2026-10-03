import { useCallback, useEffect, useRef, useState } from "react";

import type { QuizAnswer, QuizQuestion, QuizSession, QuizStandingEntry } from "../../../domain/model/QuizModels";
import { container } from "../../../di/container";
import { mapQuizErrorMessage } from "../shared/mapQuizErrorMessage";
import { buildQuizLeaderboard } from "../shared/buildQuizLeaderboard";
import type { QuizLeaderboardEntry } from "../shared/buildQuizLeaderboard";
import type { TeacherQuizUiState } from "./TeacherQuizUiState";

export function useTeacherQuizViewModel(courseId: string) {
  const [uiState, setUiState] = useState<TeacherQuizUiState>({ type: "loading" });

  const bankRef = useRef<QuizQuestion[]>([]);
  const activeSessionRef = useRef<QuizSession | null>(null);
  const leaderboardRef = useRef<QuizLeaderboardEntry[]>([]);
  const standingRef = useRef<QuizStandingEntry[]>([]);
  const unsubscribeAnswersRef = useRef<(() => void) | null>(null);

  const publishAll = useCallback(() => {
    setUiState({
      type: "content",
      bank: bankRef.current,
      activeSession: activeSessionRef.current,
      leaderboard: leaderboardRef.current,
      standing: standingRef.current,
    });
  }, []);

  const loadBank = useCallback(async () => {
    const result = await container.getQuestionBankUseCase.execute(courseId);
    if (!result.success) {
      setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
      return;
    }
    bankRef.current = result.data;
    publishAll();
  }, [courseId, publishAll]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeSession: (() => void) | undefined;

    async function start() {
      await loadBank();
      if (cancelled) return;

      unsubscribeSession = container.observeLatestQuizSessionUseCase.execute(
        courseId,
        (session) => {
          activeSessionRef.current = session;
          unsubscribeAnswersRef.current?.();
          unsubscribeAnswersRef.current = null;

          if (!session) {
            leaderboardRef.current = [];
            publishAll();
            return;
          }

          unsubscribeAnswersRef.current = container.observeQuizSessionAnswersUseCase.execute(
            courseId,
            session.id,
            (answers: QuizAnswer[]) => {
              leaderboardRef.current = buildQuizLeaderboard(session.correctOptionIndex, answers);
              publishAll();
            },
            (error) => setUiState({ type: "error", message: mapQuizErrorMessage(error) })
          );
        },
        (error) => setUiState({ type: "error", message: mapQuizErrorMessage(error) })
      );
    }

    void start();

    return () => {
      cancelled = true;
      unsubscribeSession?.();
      unsubscribeAnswersRef.current?.();
    };
  }, [courseId, loadBank, publishAll]);

  useEffect(() => {
    const unsubscribeStanding = container.observeCourseQuizStandingUseCase.execute(
      courseId,
      (standing) => {
        standingRef.current = standing;
        publishAll();
      },
      (error) => setUiState({ type: "error", message: mapQuizErrorMessage(error) })
    );

    return () => unsubscribeStanding();
  }, [courseId, publishAll]);

  const createQuestion = useCallback(
    async (text: string, options: string[], correctOptionIndex: number) => {
      const result = await container.createQuizQuestionUseCase.execute(courseId, text, options, correctOptionIndex);
      if (result.success) {
        container.analyticsReporter.logEvent("quiz_question_created", { course_id: courseId });
        await loadBank();
      } else {
        setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
      }
    },
    [courseId, loadBank]
  );

  const updateQuestion = useCallback(
    async (questionId: string, text: string, options: string[], correctOptionIndex: number) => {
      const result = await container.updateQuizQuestionUseCase.execute(
        courseId,
        questionId,
        text,
        options,
        correctOptionIndex
      );
      if (result.success) {
        container.analyticsReporter.logEvent("quiz_question_updated", { course_id: courseId });
        await loadBank();
      } else {
        setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
      }
    },
    [courseId, loadBank]
  );

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      const result = await container.deleteQuizQuestionUseCase.execute(courseId, questionId);
      if (result.success) {
        container.analyticsReporter.logEvent("quiz_question_deleted", { course_id: courseId });
        await loadBank();
      } else {
        setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
      }
    },
    [courseId, loadBank]
  );

  const launchQuestion = useCallback(
    async (question: QuizQuestion, durationSeconds: number) => {
      const result = await container.launchQuizQuestionUseCase.execute(courseId, question, durationSeconds);
      if (result.success) {
        container.analyticsReporter.logEvent("quiz_question_launched", {
          course_id: courseId,
          question_id: question.id,
        });
      } else {
        setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
      }
    },
    [courseId]
  );

  const closeActiveSession = useCallback(async () => {
    const session = activeSessionRef.current;
    if (!session || !session.isActive) return;
    const result = await container.closeQuizSessionUseCase.execute(courseId, session.id);
    if (!result.success) {
      setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
    }
  }, [courseId]);

  const resetStanding = useCallback(async () => {
    const result = await container.resetQuizStandingUseCase.execute(courseId);
    if (result.success) {
      container.analyticsReporter.logEvent("quiz_standing_reset", { course_id: courseId });
    } else {
      setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
    }
  }, [courseId]);

  return {
    uiState,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    launchQuestion,
    closeActiveSession,
    resetStanding,
  };
}