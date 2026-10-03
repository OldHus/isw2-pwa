import type { PostError, PostReaction } from "../model/PostModels";
import type { PostRepository } from "../repository/PostRepository";

export class ObservePostReactionsUseCase {
  private postRepository: PostRepository;

  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }

  execute(
    courseId: string,
    postId: string,
    onChange: (reactions: PostReaction[]) => void,
    onError?: (error: PostError) => void
  ): () => void {
    return this.postRepository.observePostReactions(courseId, postId, onChange, onError);
  }
}