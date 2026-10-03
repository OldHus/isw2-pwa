import type { AppResult } from "../model/Result";
import { REACTION_TYPES } from "../model/PostModels";
import type { PostError } from "../model/PostModels";
import type { PostRepository } from "../repository/PostRepository";

export class SetMyReactionUseCase {
  private postRepository: PostRepository;

  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }

  async execute(courseId: string, postId: string, type: string): Promise<AppResult<void, PostError>> {
    if (!REACTION_TYPES.includes(type)) {
      return { success: false, error: { type: "invalidReactionType" } };
    }
    return this.postRepository.setMyReaction(courseId, postId, type);
  }
}