import { ReactionType } from "../../../domain/model/PostModels";
import type { PostReaction } from "../../../domain/model/PostModels";
import type { ReactionSummary } from "./ReactionSummary";

const EMOJI_BY_TYPE: Record<string, string> = {
  [ReactionType.LIKE]: "👍",
  [ReactionType.LOVE]: "❤️",
  [ReactionType.HAHA]: "😄",
  [ReactionType.WOW]: "😮",
  [ReactionType.SAD]: "😢",
  [ReactionType.ANGRY]: "😠",
};

export function emojiFor(type: string): string {
  return EMOJI_BY_TYPE[type] ?? "❔";
}

export function buildReactionSummaries(reactions: PostReaction[]): ReactionSummary[] {
  const groups = new Map<string, PostReaction[]>();
  for (const reaction of reactions) {
    const group = groups.get(reaction.type);
    if (group) {
      group.push(reaction);
    } else {
      groups.set(reaction.type, [reaction]);
    }
  }

  return Array.from(groups.entries())
    .map(([type, group]) => ({
      type,
      emoji: emojiFor(type),
      count: group.length,
      reactorNames: group.map((reaction) => reaction.studentName),
    }))
    .sort((a, b) => b.count - a.count);
}