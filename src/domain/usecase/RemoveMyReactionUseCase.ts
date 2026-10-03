import type { AppResult } from "../model/Result";
import type { PostError } from "../model/PostModels";
import type { PostRepository } from "../repository/PostRepository";

export class RemoveMyReactionUseCase {
  private postRepository: PostRepository;

  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }

  async execute(courseId: string, postId: string): Promise<AppResult<void, PostError>> {
    return this.postRepository.removeMyReaction(courseId, postId);
  }
}