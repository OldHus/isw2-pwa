import { useState } from "react";

import type { Post } from "../../../domain/model/PostModels";
import { REACTION_TYPES } from "../../../domain/model/PostModels";
import type { ReactionSummary } from "../shared/ReactionSummary";
import { PostText } from "../shared/PostText";
import { Avatar } from "../../common/Avatar";
import { useAuthorPhotoUrls } from "../shared/useAuthorPhotoUrls";
import { FullScreenImageViewer } from "../shared/FullScreenImageViewer";
import { emojiFor } from "../shared/buildReactionSummaries";
import { formatRelativeTime } from "../shared/formatRelativeTime";
import { useStudentPostsViewModel } from "./useStudentPostsViewModel";
import styles from "./StudentPostsScreen.module.scss";

const POST_AUTHOR_ROLE = "docente";

interface StudentPostsScreenProps {
  courseId: string;
}

export function StudentPostsScreen({ courseId }: StudentPostsScreenProps) {
  const { uiState, react } = useStudentPostsViewModel(courseId);
  const authorUids = uiState.type === "content" ? uiState.posts.map((post) => post.authorUid) : [];
  const photoUrlByUid = useAuthorPhotoUrls(authorUids);

  switch (uiState.type) {
    case "loading":
      return (
        <div className={styles.centered} role="status" aria-live="polite">
          Cargando…
        </div>
      );
    case "error":
      return (
        <p className={styles.errorText} role="alert">
          {uiState.message}
        </p>
      );
    case "content":
      if (uiState.posts.length === 0) {
        return <p className={styles.centered}>Tu profesor aún no ha publicado nada.</p>;
      }
      return (
        <ul className={styles.postList}>
          {uiState.posts.map((post) => (
            <li key={post.id}>
              <StudentPostCard
                post={post}
                reactions={uiState.reactionsByPost[post.id] ?? []}
                myReaction={uiState.myReactionByPost[post.id] ?? null}
                authorPhotoUrl={photoUrlByUid[post.authorUid] ?? null}
                onReact={(type) => react(post.id, type)}
              />
            </li>
          ))}
        </ul>
      );
  }
}

interface StudentPostCardProps {
  post: Post;
  reactions: ReactionSummary[];
  myReaction: string | null;
  authorPhotoUrl: string | null;
  onReact: (type: string) => void;
}

function StudentPostCard({ post, reactions, myReaction, authorPhotoUrl, onReact }: StudentPostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [imageOriginRect, setImageOriginRect] = useState<DOMRect | null>(null);

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <Avatar photoUrl={authorPhotoUrl} role={POST_AUTHOR_ROLE} name={post.authorName} size={38} />
        <div className={styles.authorInfo}>
          <span className={styles.authorName}>{post.authorName}</span>
          <span className={styles.postTimestamp}>{formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>

      <div className={styles.postBody}>
        {post.text.trim().length > 0 && <PostText text={post.text} className={styles.postText} />}
      </div>

      {post.imageUrl && (
        <div className={styles.imageWrap}>
          <img
            src={post.imageUrl}
            alt=""
            className={styles.postImage}
            onClick={(event) => {
              setImageOriginRect(event.currentTarget.getBoundingClientRect());
              setShowFullScreenImage(true);
            }}
          />
        </div>
      )}

      <div className={styles.postFooter}>
        {reactions.length > 0 && (
          <div className={styles.reactionsSummary}>
            <button type="button" className={styles.reactionsToggle} onClick={() => setExpanded((previous) => !previous)}>
              {reactions.map((summary) => `${summary.emoji} ${summary.count}`).join(" ")}
            </button>
            {expanded && (
              <ul className={styles.reactorList}>
                {reactions.map((summary) => (
                  <li key={summary.type} className={styles.reactorRow}>
                    {summary.emoji} {summary.reactorNames.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className={styles.reactionPicker}>
          {REACTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={type === myReaction ? `${styles.reactionButton} ${styles.reactionButtonSelected}` : styles.reactionButton}
              onClick={() => onReact(type)}
              aria-label={`Reaccionar con ${type}`}
              aria-pressed={type === myReaction}
            >
              {emojiFor(type)}
            </button>
          ))}
        </div>
      </div>

      {showFullScreenImage && post.imageUrl && (
        <FullScreenImageViewer
          imageUrl={post.imageUrl}
          originRect={imageOriginRect}
          postText={post.text}
          onDismiss={() => setShowFullScreenImage(false)}
        />
      )}
    </div>
  );
}