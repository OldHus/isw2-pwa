import type { AppResult } from "../model/Result";
import type { Post, PostError, PostReaction } from "../model/PostModels";

export interface PostRepository {
  //Teacher
  createPost(courseId: string, text: string, imageFile: File | null): Promise<AppResult<Post, PostError>>;

  updatePost(
    courseId: string,
    postId: string,
    text: string,
    newImageFile: File | null,
    removeImage: boolean
  ): Promise<AppResult<void, PostError>>;

  deletePost(courseId: string, postId: string): Promise<AppResult<void, PostError>>;

  //Shared
  observePosts(
    courseId: string,
    onChange: (posts: Post[]) => void,
    onError?: (error: PostError) => void
  ): () => void;

  observePostReactions(
    courseId: string,
    postId: string,
    onChange: (reactions: PostReaction[]) => void,
    onError?: (error: PostError) => void
  ): () => void;

  //Student
  setMyReaction(courseId: string, postId: string, type: string): Promise<AppResult<void, PostError>>;

  removeMyReaction(courseId: string, postId: string): Promise<AppResult<void, PostError>>;

  observeMyReaction(
    courseId: string,
    postId: string,
    onChange: (reaction: PostReaction | null) => void,
    onError?: (error: PostError) => void
  ): () => void;
}