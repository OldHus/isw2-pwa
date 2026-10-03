import { useCallback, useEffect, useRef, useState } from "react";

import type { Poll } from "../../../domain/model/PollModels";
import { container } from "../../../di/container";
import { mapPollErrorMessage } from "../shared/mapPollErrorMessage";
import { buildPollOptionResults } from "../shared/buildPollOptionResults";
import type { TeacherPollUiState } from "./TeacherPollUiState";

export function useTeacherPollViewModel(courseId: string) {
  const [uiState, setUiState] = useState<TeacherPollUiState>({ type: "loading" });

  const currentPollRef = useRef<Poll | null>(null);
  const unsubscribeVotesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribePoll = container.observeLatestPollUseCase.execute(
      courseId,
      (poll) => {
        currentPollRef.current = poll;
        unsubscribeVotesRef.current?.();
        unsubscribeVotesRef.current = null;

        if (!poll) {
          setUiState({ type: "noPoll" });
          return;
        }

        unsubscribeVotesRef.current = container.observePollVotesUseCase.execute(
          courseId,
          poll.id,
          (votes) => {
            setUiState({ type: "result", poll, optionResults: buildPollOptionResults(poll, votes) });
          },
          (error) => {
            setUiState({ type: "error", message: mapPollErrorMessage(error) });
          }
        );
      },
      (error) => {
        setUiState({ type: "error", message: mapPollErrorMessage(error) });
      }
    );

    return () => {
      unsubscribePoll();
      unsubscribeVotesRef.current?.();
    };
  }, [courseId]);

  const startPoll = useCallback(
    async (question: string, options: string[], expiresAtMillis: number) => {
      const result = await container.startPollUseCase.execute(courseId, question, options, expiresAtMillis);
      if (result.success) {
        container.analyticsReporter.logEvent("poll_started", { course_id: courseId });
      } else {
        setUiState({ type: "error", message: mapPollErrorMessage(result.error) });
      }
    },
    [courseId]
  );

  const closeActivePoll = useCallback(async () => {
    const poll = currentPollRef.current;
    if (!poll || !poll.isActive) return;
    const result = await container.closePollUseCase.execute(courseId, poll.id);
    if (!result.success) {
      setUiState({ type: "error", message: mapPollErrorMessage(result.error) });
    }
  }, [courseId]);

  return { uiState, startPoll, closeActivePoll };
}