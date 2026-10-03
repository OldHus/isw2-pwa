import type { AppResult } from "../model/Result";
import type { PostError } from "../model/PostModels";
import type { PostRepository } from "../repository/PostRepository";

export class UpdatePostUseCase {
  private postRepository: PostRepository;

  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }

  async execute(
    courseId: string,
    postId: string,
    text: string,
    newImageFile: File | null,
    removeImage: boolean
  ): Promise<AppResult<void, PostError>> {
    return this.postRepository.updatePost(courseId, postId, text, newImageFile, removeImage);
  }
}