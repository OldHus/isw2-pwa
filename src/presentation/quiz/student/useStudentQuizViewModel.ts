import { useCallback, useEffect, useRef, useState } from "react";

import type { QuizStandingEntry } from "../../../domain/model/QuizModels";
import { container } from "../../../di/container";
import { mapQuizErrorMessage } from "../shared/mapQuizErrorMessage";
import { buildQuizLeaderboard } from "../shared/buildQuizLeaderboard";
import type { QuizLeaderboardEntry } from "../shared/buildQuizLeaderboard";
import type { StudentQuizUiState } from "./StudentQuizUiState";

export function useStudentQuizViewModel(courseId: string) {
  const [uiState, setUiState] = useState<StudentQuizUiState>({ type: "loading" });
  const uiStateRef = useRef<StudentQuizUiState>(uiState);
  uiStateRef.current = uiState;

  const [myStanding, setMyStanding] = useState<QuizStandingEntry | null>(null);
  const [standing, setStanding] = useState<QuizStandingEntry[]>([]);
  const [questionRanking, setQuestionRanking] = useState<QuizLeaderboardEntry[]>([]);

  const unsubscribeAnswerRef = useRef<(() => void) | null>(null);
  const unsubscribeRankingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeSession = container.observeLatestQuizSessionUseCase.execute(
      courseId,
      (session) => {
        unsubscribeAnswerRef.current?.();
        unsubscribeAnswerRef.current = null;
        unsubscribeRankingRef.current?.();
        unsubscribeRankingRef.current = null;

        if (!session) {
          setQuestionRanking([]);
          setUiState({ type: "noActiveQuestion" });
          return;
        }

        if (session.isActive) {
          setQuestionRanking([]);
        } else {
          unsubscribeRankingRef.current = container.observeQuizSessionAnswersUseCase.execute(
            courseId,
            session.id,
            (answers) => setQuestionRanking(buildQuizLeaderboard(session.correctOptionIndex, answers)),
            () => setQuestionRanking([])
          );
        }

        unsubscribeAnswerRef.current = container.observeMyQuizAnswerUseCase.execute(
          courseId,
          session.id,
          (myAnswer) => {
            setUiState({ type: "question", session, myAnswer });
          },
          (error) => {
            setUiState({ type: "error", message: mapQuizErrorMessage(error) });
          }
        );
      },
      (error) => {
        setUiState({ type: "error", message: mapQuizErrorMessage(error) });
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeAnswerRef.current?.();
      unsubscribeRankingRef.current?.();
    };
  }, [courseId]);

  useEffect(() => {
    const unsubscribeStanding = container.observeMyQuizStandingUseCase.execute(
      courseId,
      (entry) => setMyStanding(entry),
      () => {
        // response view ask
      }
    );

    return () => unsubscribeStanding();
  }, [courseId]);

  useEffect(() => {
    const unsubscribeCourseStanding = container.observeCourseQuizStandingUseCase.execute(
      courseId,
      (entries) => setStanding(entries),
      () => setStanding([])
    );

    return () => unsubscribeCourseStanding();
  }, [courseId]);

  const answer = useCallback(
    async (optionIndex: number) => {
      const current = uiStateRef.current;
      if (current.type !== "question" || current.myAnswer !== null) return;
      const result = await container.submitQuizAnswerUseCase.execute(courseId, current.session, optionIndex);
      if (result.success) {
        container.analyticsReporter.logEvent("quiz_answer_submitted", {
          course_id: courseId,
          session_id: current.session.id,
        });
      } else {
        container.analyticsReporter.logEvent("quiz_answer_error", {
          course_id: courseId,
          session_id: current.session.id,
        });
        setUiState({ type: "error", message: mapQuizErrorMessage(result.error) });
      }
    },
    [courseId]
  );

  return { uiState, answer, myStanding, standing, questionRanking };
}