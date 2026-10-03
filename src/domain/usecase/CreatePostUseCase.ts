import type { AppResult } from "../model/Result";
import type { Post, PostError } from "../model/PostModels";
import type { PostRepository } from "../repository/PostRepository";

export class CreatePostUseCase {
  private postRepository: PostRepository;

  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }

  async execute(courseId: string, text: string, imageFile: File | null): Promise<AppResult<Post, PostError>> {
    if (text.trim().length === 0 && imageFile === null) {
      return { success: false, error: { type: "emptyContent" } };
    }
    return this.postRepository.createPost(courseId, text, imageFile);
  }
}