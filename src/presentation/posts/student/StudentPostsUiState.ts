import type { Post } from "../../../domain/model/PostModels";
import type { ReactionSummary } from "../shared/ReactionSummary";

export type StudentPostsUiState =
  | { type: "loading" }
  | { type: "error"; message: string }
  | {
      type: "content";
      posts: Post[];
      reactionsByPost: Record<string, ReactionSummary[]>;
      myReactionByPost: Record<string, string | null>;
    };