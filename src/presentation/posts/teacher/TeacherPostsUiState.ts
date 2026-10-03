import type { Post } from "../../../domain/model/PostModels";
import type { ReactionSummary } from "../shared/ReactionSummary";

export type TeacherPostsUiState =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "content";
      posts: Post[];
      reactionsByPost: Record<string, ReactionSummary[]>;
    };