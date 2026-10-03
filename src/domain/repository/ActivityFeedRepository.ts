import type { ActivityItem } from "../model/ActivityFeedModels";

export interface ActivityFeedRepository {
  observeCourseActivity(
    courseId: string,
    onChange: (items: ActivityItem[]) => void,
    onError?: (error: unknown) => void
  ): () => void;
}