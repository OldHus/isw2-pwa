export interface Post {
  id: string;
  text: string;
  imageUrl: string | null;
  createdAt: number;
  editedAt: number | null;
  authorName: string;
  authorUid: string;
}

export interface PostReaction {
  studentUid: string;
  studentName: string;
  type: string;
  reactedAt: number;
}

export const ReactionType = {
  LIKE: "me_gusta",
  LOVE: "me_encanta",
  HAHA: "jaja",
  WOW: "wow",
  SAD: "triste",
  ANGRY: "enojado",
} as const;

export const REACTION_TYPES: readonly string[] = [
  ReactionType.LIKE,
  ReactionType.LOVE,
  ReactionType.HAHA,
  ReactionType.WOW,
  ReactionType.SAD,
  ReactionType.ANGRY,
];

export type PostError =
  | { type: "emptyContent" }
  | { type: "invalidReactionType" }
  | { type: "unknown"; message: string };