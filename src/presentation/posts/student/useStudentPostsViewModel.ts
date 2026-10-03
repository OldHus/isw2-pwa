import { useCallback, useEffect, useRef, useState } from "react";

import type { Post, PostReaction } from "../../../domain/model/PostModels";
import { container } from "../../../di/container";
import { mapPostErrorMessage } from "../shared/mapPostErrorMessage";
import { buildReactionSummaries } from "../shared/buildReactionSummaries";
import type { StudentPostsUiState } from "./StudentPostsUiState";

export function useStudentPostsViewModel(courseId: string) {
  const [uiState, setUiState] = useState<StudentPostsUiState>({ type: "loading" });
  const uiStateRef = useRef<StudentPostsUiState>(uiState);
  uiStateRef.current = uiState;

  const postsRef = useRef<Post[]>([]);
  const reactionsByPostRef = useRef<Record<string, PostReaction[]>>({});
  const myReactionByPostRef = useRef<Record<string, PostReaction | null>>({});
  const reactionUnsubscribersRef = useRef<Record<string, () => void>>({});
  const myReactionUnsubscribersRef = useRef<Record<string, () => void>>({});

  const publish = useCallback(() => {
    setUiState({
      type: "content",
      posts: postsRef.current,
      reactionsByPost: Object.fromEntries(
        postsRef.current.map((post) => [post.id, buildReactionSummaries(reactionsByPostRef.current[post.id] ?? [])])
      ),
      myReactionByPost: Object.fromEntries(
        postsRef.current.map((post) => [post.id, myReactionByPostRef.current[post.id]?.type ?? null])
      ),
    });
  }, []);

  useEffect(() => {
    const unsubscribePosts = container.observePostsUseCase.execute(
      courseId,
      (posts) => {
        postsRef.current = posts;
        const currentIds = new Set(posts.map((post) => post.id));

        for (const postId of Object.keys(reactionUnsubscribersRef.current)) {
          if (!currentIds.has(postId)) {
            reactionUnsubscribersRef.current[postId]();
            delete reactionUnsubscribersRef.current[postId];
            delete reactionsByPostRef.current[postId];
          }
        }
        for (const postId of Object.keys(myReactionUnsubscribersRef.current)) {
          if (!currentIds.has(postId)) {
            myReactionUnsubscribersRef.current[postId]();
            delete myReactionUnsubscribersRef.current[postId];
            delete myReactionByPostRef.current[postId];
          }
        }

        for (const post of posts) {
          if (!reactionUnsubscribersRef.current[post.id]) {
            reactionUnsubscribersRef.current[post.id] = container.observePostReactionsUseCase.execute(
              courseId,
              post.id,
              (reactions) => {
                reactionsByPostRef.current = { ...reactionsByPostRef.current, [post.id]: reactions };
                publish();
              },
              (error) => setUiState({ type: "error", message: mapPostErrorMessage(error) })
            );
          }
          if (!myReactionUnsubscribersRef.current[post.id]) {
            myReactionUnsubscribersRef.current[post.id] = container.observeMyReactionUseCase.execute(
              courseId,
              post.id,
              (reaction) => {
                myReactionByPostRef.current = { ...myReactionByPostRef.current, [post.id]: reaction };
                publish();
              },
              (error) => setUiState({ type: "error", message: mapPostErrorMessage(error) })
            );
          }
        }

        publish();
      },
      (error) => setUiState({ type: "error", message: mapPostErrorMessage(error) })
    );

    return () => {
      unsubscribePosts();
      Object.values(reactionUnsubscribersRef.current).forEach((unsubscribe) => unsubscribe());
      Object.values(myReactionUnsubscribersRef.current).forEach((unsubscribe) => unsubscribe());
      reactionUnsubscribersRef.current = {};
      myReactionUnsubscribersRef.current = {};
      reactionsByPostRef.current = {};
      myReactionByPostRef.current = {};
    };
  }, [courseId, publish]);

  const react = useCallback(
    async (postId: string, type: string) => {
      const current = uiStateRef.current;
      const currentReaction = current.type === "content" ? current.myReactionByPost[postId] : null;

      if (currentReaction === type) {
        const result = await container.removeMyReactionUseCase.execute(courseId, postId);
        if (result.success) {
          container.analyticsReporter.logEvent("post_reaction_removed", { course_id: courseId, post_id: postId });
        } else {
          setUiState({ type: "error", message: mapPostErrorMessage(result.error) });
        }
      } else {
        const result = await container.setMyReactionUseCase.execute(courseId, postId, type);
        if (result.success) {
          container.analyticsReporter.logEvent("post_reaction_set", { course_id: courseId, post_id: postId, type });
        } else {
          setUiState({ type: "error", message: mapPostErrorMessage(result.error) });
        }
      }
    },
    [courseId]
  );

  return { uiState, react };
}