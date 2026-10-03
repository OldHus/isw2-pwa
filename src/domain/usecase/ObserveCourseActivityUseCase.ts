import type { ActivityFeedRepository } from "../repository/ActivityFeedRepository";
import type { ActivityItem } from "../model/ActivityFeedModels";

export class ObserveCourseActivityUseCase {
  private repository: ActivityFeedRepository;

  constructor(repository: ActivityFeedRepository) {
    this.repository = repository;
  }

  execute(
    courseId: string,
    onChange: (items: ActivityItem[]) => void,
    onError?: (error: unknown) => void
  ): () => void {
    return this.repository.observeCourseActivity(courseId, onChange, onError);
  }
}