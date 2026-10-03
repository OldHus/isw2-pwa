import { Routes as AppRoutePaths } from "../../routes/Routes";
import type { ActivityItemType } from "../../domain/model/ActivityFeedModels";

export const ROUTE_BY_TYPE: Record<ActivityItemType, string> = {
  post: AppRoutePaths.posts,
  poll: AppRoutePaths.polls,
  quiz: AppRoutePaths.quiz,
};