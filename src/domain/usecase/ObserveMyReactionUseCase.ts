import type { PostError, PostReaction } from "../model/PostModels";
import type { PostRepository } from "../repository/PostRepository";

export class ObserveMyReactionUseCase {
  private postRepository: PostRepository;

  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }

  execute(
    courseId: string,
    postId: string,
    onChange: (reaction: PostReaction | null) => void,
    onError?: (error: PostError) => void
  ): () => void {
    return this.postRepository.observeMyReaction(courseId, postId, onChange, onError);
  }
}