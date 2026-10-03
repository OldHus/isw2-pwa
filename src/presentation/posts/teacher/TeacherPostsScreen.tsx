import { useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import type { Post } from "../../../domain/model/PostModels";
import type { ReactionSummary } from "../shared/ReactionSummary";
import { PostText } from "../shared/PostText";
import { Avatar } from "../../common/Avatar";
import { useAuthorPhotoUrls } from "../shared/useAuthorPhotoUrls";
import { FullScreenImageViewer } from "../shared/FullScreenImageViewer";
import { formatRelativeTime } from "../shared/formatRelativeTime";
import { useTeacherPostsViewModel } from "./useTeacherPostsViewModel";
import styles from "./TeacherPostsScreen.module.scss";

const POST_AUTHOR_ROLE = "docente";

interface TeacherPostsScreenProps {
    courseId: string;
}

export function TeacherPostsScreen({ courseId }: TeacherPostsScreenProps) {
    const { uiState, createPost, updatePost, deletePost } = useTeacherPostsViewModel(courseId);

    const [showComposer, setShowComposer] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    return (
        <div className={styles.wrapper}>
            <TeacherPostsBody
                uiState={uiState}
                onEdit={(post) => {
                    setEditingPost(post);
                    setShowComposer(true);
                }}
                onDelete={deletePost}
            />

            <button
                type="button"
                className={styles.fab}
                onClick={() => {
                    setEditingPost(null);
                    setShowComposer(true);
                }}
                aria-label="Nueva publicación"
            >
                <Plus size={22} aria-hidden="true" />
            </button>

            {showComposer && (
                <PostComposerDialog
                    initial={editingPost}
                    onDismiss={() => setShowComposer(false)}
                    onConfirm={(text, imageFile, removeImage) => {
                        if (editingPost) {
                            updatePost(editingPost.id, text, imageFile, removeImage);
                        } else {
                            createPost(text, imageFile);
                        }
                        setShowComposer(false);
                    }}
                />
            )}
        </div>
    );
}

interface TeacherPostsBodyProps {
    uiState: ReturnType<typeof useTeacherPostsViewModel>["uiState"];
    onEdit: (post: Post) => void;
    onDelete: (postId: string) => void;
}

function TeacherPostsBody({ uiState, onEdit, onDelete }: TeacherPostsBodyProps) {
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
                return (
                    <p className={styles.centered}>
                        Aún no has publicado nada. Toca “Nueva publicación” para tu primer post.
                    </p>
                );
            }
            return (
                <ul className={styles.postList}>
                    {uiState.posts.map((post) => (
                        <li key={post.id}>
                            <PostCard
                                post={post}
                                reactions={uiState.reactionsByPost[post.id] ?? []}
                                authorPhotoUrl={photoUrlByUid[post.authorUid] ?? null}
                                onEdit={() => onEdit(post)}
                                onDelete={() => onDelete(post.id)}
                            />
                        </li>
                    ))}
                </ul>
            );
    }
}

interface PostCardProps {
    post: Post;
    reactions: ReactionSummary[];
    authorPhotoUrl: string | null;
    onEdit: () => void;
    onDelete: () => void;
}

function PostCard({ post, reactions, authorPhotoUrl, onEdit, onDelete }: PostCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [showFullScreenImage, setShowFullScreenImage] = useState(false);
    const [imageOriginRect, setImageOriginRect] = useState<DOMRect | null>(null);

    const reactionsSummaryText = reactions.map((summary) => `${summary.emoji} ${summary.count}`).join(" ");

    return (
        <div className={styles.postCard}>
            <div className={styles.postHeader}>
                <Avatar photoUrl={authorPhotoUrl} role={POST_AUTHOR_ROLE} name={post.authorName} size={38} />
                <div className={styles.authorInfo}>
                    <span className={styles.authorName}>{post.authorName}</span>
                    <span className={styles.postTimestamp}>{formatRelativeTime(post.createdAt)}</span>
                </div>
                <div className={styles.headerActions}>
                    <button type="button" className={styles.iconButton} onClick={onEdit} aria-label="Editar publicación">
                        <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className={styles.iconButton} onClick={onDelete} aria-label="Eliminar publicación">
                        <Trash2 size={16} aria-hidden="true" />
                    </button>
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
                <button type="button" className={styles.reactionsToggle} onClick={() => setExpanded((previous) => !previous)}>
                    {reactionsSummaryText.length > 0 ? reactionsSummaryText : "Sin reacciones"}
                </button>

                {expanded && reactions.length > 0 && (
                    <ul className={styles.reactorList}>
                        {reactions.map((summary) => (
                            <li key={summary.type} className={styles.reactorRow}>
                                {summary.emoji} {summary.reactorNames.join(", ")}
                            </li>
                        ))}
                    </ul>
                )}
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

interface PostComposerDialogProps {
    initial: Post | null;
    onDismiss: () => void;
    onConfirm: (text: string, imageFile: File | null, removeImage: boolean) => void;
}

function PostComposerDialog({ initial, onDismiss, onConfirm }: PostComposerDialogProps) {
    const [text, setText] = useState(initial?.text ?? "");
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasExistingImage = initial?.imageUrl != null && !removeExistingImage;
    const canSubmit = text.trim().length > 0 || newImageFile !== null || hasExistingImage;

    function handleFileSelected(file: File | null) {
        setNewImageFile(file);
        if (newImagePreviewUrl) URL.revokeObjectURL(newImagePreviewUrl);
        setNewImagePreviewUrl(file ? URL.createObjectURL(file) : null);
        if (file) setRemoveExistingImage(false);
    }

    return (
        <div className={styles.overlay} role="presentation" onClick={onDismiss}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="post-composer-title"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id="post-composer-title" className={styles.dialogTitle}>
                    {initial ? "Editar publicación" : "Nueva publicación"}
                </h2>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="post-text">
                        Texto (opcional si hay imagen)
                    </label>
                    <textarea
                        id="post-text"
                        className={styles.textarea}
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        rows={4}
                    />
                </div>

                {newImagePreviewUrl ? (
                    <div className={styles.imagePreviewWrap}>
                        <img src={newImagePreviewUrl} alt="" className={styles.imagePreview} />
                        <button type="button" className={styles.linkButton} onClick={() => handleFileSelected(null)}>
                            Quitar imagen seleccionada
                        </button>
                    </div>
                ) : hasExistingImage ? (
                    <div className={styles.imagePreviewWrap}>
                        <img src={initial?.imageUrl ?? ""} alt="" className={styles.imagePreview} />
                        <button type="button" className={styles.linkButton} onClick={() => setRemoveExistingImage(true)}>
                            Quitar imagen
                        </button>
                    </div>
                ) : null}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
                />
                <button type="button" className={styles.outlinedButton} onClick={() => fileInputRef.current?.click()}>
                    {newImageFile || hasExistingImage ? "Cambiar imagen" : "Agregar imagen"}
                </button>

                <div className={styles.dialogActions}>
                    <button type="button" className={styles.outlinedButton} onClick={onDismiss}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => canSubmit && onConfirm(text, newImageFile, removeExistingImage)}
                        disabled={!canSubmit}
                    >
                        Publicar
                    </button>
                </div>
            </div>
        </div>
    );
}