import { useCallback, useEffect, useRef, useState } from "react";

import type { Poll, PollVote } from "../../../domain/model/PollModels";
import { container } from "../../../di/container";
import { mapPollErrorMessage } from "../shared/mapPollErrorMessage";
import { buildPollOptionResults } from "../shared/buildPollOptionResults";
import type { StudentPollUiState } from "./StudentPollUiState";

export function useStudentPollViewModel(courseId: string) {
  const [uiState, setUiState] = useState<StudentPollUiState>({ type: "loading" });

  const currentPollRef = useRef<Poll | null>(null);
  const latestVotesRef = useRef<PollVote[]>([]);
  const myOptionIndexRef = useRef<number | null>(null);
  const unsubscribeVotesRef = useRef<(() => void) | null>(null);
  const unsubscribeMyVoteRef = useRef<(() => void) | null>(null);

  const publishResult = useCallback((poll: Poll) => {
    setUiState({
      type: "result",
      poll,
      optionResults: buildPollOptionResults(poll, latestVotesRef.current),
      myOptionIndex: myOptionIndexRef.current,
    });
  }, []);

  useEffect(() => {
    const unsubscribePoll = container.observeLatestPollUseCase.execute(
      courseId,
      (poll) => {
        currentPollRef.current = poll;
        unsubscribeVotesRef.current?.();
        unsubscribeMyVoteRef.current?.();
        unsubscribeVotesRef.current = null;
        unsubscribeMyVoteRef.current = null;
        latestVotesRef.current = [];
        myOptionIndexRef.current = null;

        if (!poll) {
          setUiState({ type: "noPoll" });
          return;
        }


        unsubscribeVotesRef.current = container.observePollVotesUseCase.execute(
          courseId,
          poll.id,
          (votes) => {
            latestVotesRef.current = votes;
            publishResult(poll);
          },
          (error) => {
            setUiState({ type: "error", message: mapPollErrorMessage(error) });
          }
        );

        unsubscribeMyVoteRef.current = container.observeMyVoteUseCase.execute(
          courseId,
          poll.id,
          (myVote) => {
            myOptionIndexRef.current = myVote ? myVote.optionIndex : null;
            publishResult(poll);
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
      unsubscribeMyVoteRef.current?.();
    };
  }, [courseId, publishResult]);

  const vote = useCallback(
    async (optionIndex: number) => {
      const poll = currentPollRef.current;
      if (!poll) return;
      const result = await container.submitVoteUseCase.execute(courseId, poll, optionIndex);
      if (!result.success) {
        setUiState({ type: "error", message: mapPollErrorMessage(result.error) });
      }
    },
    [courseId]
  );

  return { uiState, vote };
}