import { useCallback, useEffect, useRef, useState } from "react";

import type { Post, PostReaction } from "../../../domain/model/PostModels";
import { container } from "../../../di/container";
import { mapPostErrorMessage } from "../shared/mapPostErrorMessage";
import { buildReactionSummaries } from "../shared/buildReactionSummaries";
import type { TeacherPostsUiState } from "./TeacherPostsUiState";

export function useTeacherPostsViewModel(courseId: string) {
  const [uiState, setUiState] = useState<TeacherPostsUiState>({ type: "loading" });

  const postsRef = useRef<Post[]>([]);
  const reactionsByPostRef = useRef<Record<string, PostReaction[]>>({});
  const reactionUnsubscribersRef = useRef<Record<string, () => void>>({});

  const publish = useCallback(() => {
    setUiState({
      type: "content",
      posts: postsRef.current,
      reactionsByPost: Object.fromEntries(
        postsRef.current.map((post) => [post.id, buildReactionSummaries(reactionsByPostRef.current[post.id] ?? [])])
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
        }

        publish();
      },
      (error) => setUiState({ type: "error", message: mapPostErrorMessage(error) })
    );

    return () => {
      unsubscribePosts();
      Object.values(reactionUnsubscribersRef.current).forEach((unsubscribe) => unsubscribe());
      reactionUnsubscribersRef.current = {};
      reactionsByPostRef.current = {};
    };
  }, [courseId, publish]);

  const createPost = useCallback(
    async (text: string, imageFile: File | null) => {
      const result = await container.createPostUseCase.execute(courseId, text, imageFile);
      if (result.success) {
        container.analyticsReporter.logEvent("post_created", { course_id: courseId });
      } else {
        setUiState({ type: "error", message: mapPostErrorMessage(result.error) });
      }
    },
    [courseId]
  );

  const updatePost = useCallback(
    async (postId: string, text: string, newImageFile: File | null, removeImage: boolean) => {
      const result = await container.updatePostUseCase.execute(courseId, postId, text, newImageFile, removeImage);
      if (result.success) {
        container.analyticsReporter.logEvent("post_updated", { course_id: courseId, post_id: postId });
      } else {
        setUiState({ type: "error", message: mapPostErrorMessage(result.error) });
      }
    },
    [courseId]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const result = await container.deletePostUseCase.execute(courseId, postId);
      if (result.success) {
        container.analyticsReporter.logEvent("post_deleted", { course_id: courseId, post_id: postId });
      } else {
        setUiState({ type: "error", message: mapPostErrorMessage(result.error) });
      }
    },
    [courseId]
  );

  return { uiState, createPost, updatePost, deletePost };
}