import type { Post, PostError } from "../model/PostModels";
import type { PostRepository } from "../repository/PostRepository";

export class ObservePostsUseCase {
  private postRepository: PostRepository;

  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }

  execute(courseId: string, onChange: (posts: Post[]) => void, onError?: (error: PostError) => void): () => void {
    return this.postRepository.observePosts(courseId, onChange, onError);
  }
}