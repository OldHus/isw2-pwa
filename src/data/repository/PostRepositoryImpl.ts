import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import type { CollectionReference, DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { auth, db, storage } from "../firebase/config";
import type { Post, PostError, PostReaction } from "../../domain/model/PostModels";
import type { PostRepository } from "../../domain/repository/PostRepository";
import type { CrashReporter } from "../../domain/service/CrashReporter";
import { failure, success } from "../../domain/model/Result";
import type { AppResult } from "../../domain/model/Result";

const COURSES_COLLECTION = "cursos";
const POSTS_SUBCOLLECTION = "posts";
const REACTIONS_SUBCOLLECTION = "reacciones";
const USERS_COLLECTION = "usuarios";

const TEXT_FIELD = "texto";
const IMAGE_URL_FIELD = "imagenUrl";
const CREATED_AT_FIELD = "creadaEn";
const EDITED_AT_FIELD = "editadaEn";

const AUTHOR_NAME_FIELD = "autorNombre";
const AUTHOR_UID_FIELD = "autorUid";

const STUDENT_NAME_FIELD = "nombreEstudiante";
const REACTION_TYPE_FIELD = "tipo";
const REACTED_AT_FIELD = "reaccionadoEn";

const DEFAULT_AUTHOR_NAME = "Profesor";

function toUnknownError(e: unknown, fallback: string): PostError {
  const message = e instanceof Error ? e.message : fallback;
  return { type: "unknown", message: message || fallback };
}

function toPost(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Post {
  const data = snapshot.data() ?? {};
  const createdAt = data[CREATED_AT_FIELD] as Timestamp | undefined;
  const editedAt = data[EDITED_AT_FIELD] as Timestamp | null | undefined;
  const authorName = ((data[AUTHOR_NAME_FIELD] as string) ?? "").trim();
  return {
    id: snapshot.id,
    text: (data[TEXT_FIELD] as string) ?? "",
    imageUrl: (data[IMAGE_URL_FIELD] as string | null) ?? null,
    createdAt: createdAt ? createdAt.toMillis() : 0,
    editedAt: editedAt ? editedAt.toMillis() : null,
    authorName: authorName.length > 0 ? authorName : DEFAULT_AUTHOR_NAME,
    authorUid: ((data[AUTHOR_UID_FIELD] as string) ?? "").trim(),
  };
}

function toPostReaction(snapshot: DocumentSnapshot | QueryDocumentSnapshot): PostReaction {
  const data = snapshot.data() ?? {};
  const reactedAt = data[REACTED_AT_FIELD] as Timestamp | undefined;
  const studentName = ((data[STUDENT_NAME_FIELD] as string) ?? "").trim();
  return {
    studentUid: snapshot.id,
    studentName: studentName.length > 0 ? studentName : snapshot.id,
    type: (data[REACTION_TYPE_FIELD] as string) ?? "",
    reactedAt: reactedAt ? reactedAt.toMillis() : 0,
  };
}

export class PostRepositoryImpl implements PostRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  //Teacher

  async createPost(courseId: string, text: string, imageFile: File | null): Promise<AppResult<Post, PostError>> {
    try {
      const docRef = doc(this.postsCollection(courseId));
      const now = Timestamp.now();
      const authorUid = auth.currentUser?.uid ?? "";
      const authorName = await this.resolveAuthorName(authorUid);

      await setDoc(docRef, {
        [TEXT_FIELD]: text,
        [IMAGE_URL_FIELD]: null,
        [CREATED_AT_FIELD]: now,
        [EDITED_AT_FIELD]: null,
        [AUTHOR_NAME_FIELD]: authorName,
        [AUTHOR_UID_FIELD]: authorUid,
      });

      const imageUrl = imageFile ? await this.uploadImage(courseId, docRef.id, imageFile) : null;
      if (imageUrl !== null) {
        await updateDoc(docRef, { [IMAGE_URL_FIELD]: imageUrl });
      }

      return success({
        id: docRef.id,
        text,
        imageUrl,
        createdAt: now.toMillis(),
        editedAt: null,
        authorName,
        authorUid,
      });
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo publicar"));
    }
  }

  async updatePost(
    courseId: string,
    postId: string,
    text: string,
    newImageFile: File | null,
    removeImage: boolean
  ): Promise<AppResult<void, PostError>> {
    try {
      const updates: DocumentData = {
        [TEXT_FIELD]: text,
        [EDITED_AT_FIELD]: Timestamp.now(),
      };
      if (newImageFile) {
        updates[IMAGE_URL_FIELD] = await this.uploadImage(courseId, postId, newImageFile);
      } else if (removeImage) {
        await this.deleteImageIfExists(courseId, postId);
        updates[IMAGE_URL_FIELD] = null;
      }
      const postRef = doc(this.postsCollection(courseId), postId);
      await updateDoc(postRef, updates);
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo editar la publicación"));
    }
  }

  async deletePost(courseId: string, postId: string): Promise<AppResult<void, PostError>> {
    try {
      await this.deleteImageIfExists(courseId, postId);
      await deleteDoc(doc(this.postsCollection(courseId), postId));
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo eliminar la publicación"));
    }
  }

  //Shared

  observePosts(
    courseId: string,
    onChange: (posts: Post[]) => void,
    onError?: (error: PostError) => void
  ): () => void {
    const postsQuery = query(this.postsCollection(courseId), orderBy(CREATED_AT_FIELD, "desc"));
    return onSnapshot(
      postsQuery,
      (snapshot) => {
        if ("docs" in snapshot) {
          onChange(snapshot.docs.map(toPost));
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudo cargar el muro"));
      }
    );
  }

  observePostReactions(
    courseId: string,
    postId: string,
    onChange: (reactions: PostReaction[]) => void,
    onError?: (error: PostError) => void
  ): () => void {
    return onSnapshot(
      this.reactionsCollection(courseId, postId),
      (snapshot) => {
        if ("docs" in snapshot) {
          onChange(snapshot.docs.map(toPostReaction));
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudieron cargar las reacciones"));
      }
    );
  }

  //Student

  async setMyReaction(courseId: string, postId: string, type: string): Promise<AppResult<void, PostError>> {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      return failure({ type: "unknown", message: "Usuario no autenticado" });
    }
    try {
      const ownProfileSnapshot = await getDoc(doc(collection(db, USERS_COLLECTION), studentUid));
      const ownProfile = ownProfileSnapshot.data() as DocumentData | undefined;
      const profileName = ((ownProfile?.["nombre"] as string | undefined) ?? "").trim();
      const studentName = profileName.length > 0 ? profileName : auth.currentUser?.email ?? studentUid;

      await setDoc(doc(this.reactionsCollection(courseId, postId), studentUid), {
        [STUDENT_NAME_FIELD]: studentName,
        [REACTION_TYPE_FIELD]: type,
        [REACTED_AT_FIELD]: Timestamp.now(),
      });
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo registrar tu reacción"));
    }
  }

  async removeMyReaction(courseId: string, postId: string): Promise<AppResult<void, PostError>> {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      return failure({ type: "unknown", message: "Usuario no autenticado" });
    }
    try {
      await deleteDoc(doc(this.reactionsCollection(courseId, postId), studentUid));
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo quitar tu reacción"));
    }
  }

  observeMyReaction(
    courseId: string,
    postId: string,
    onChange: (reaction: PostReaction | null) => void,
    onError?: (error: PostError) => void
  ): () => void {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      onError?.({ type: "unknown", message: "Usuario no autenticado" });
      return () => {};
    }
    const reactionRef = doc(this.reactionsCollection(courseId, postId), studentUid);
    return onSnapshot(
      reactionRef,
      (snapshot) => {
        if (!("docs" in snapshot)) {
          onChange(snapshot.exists() ? toPostReaction(snapshot) : null);
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudo cargar tu reacción"));
      }
    );
  }

  //Helpers

  private async resolveAuthorName(teacherUid: string): Promise<string> {
    if (!teacherUid) return DEFAULT_AUTHOR_NAME;
    try {
      const profileSnapshot = await getDoc(doc(collection(db, USERS_COLLECTION), teacherUid));
      const profile = profileSnapshot.data() as DocumentData | undefined;
      const profileName = ((profile?.["nombre"] as string | undefined) ?? "").trim();
      return profileName.length > 0 ? profileName : auth.currentUser?.email ?? DEFAULT_AUTHOR_NAME;
    } catch (e) {
      this.crashReporter.recordException(e);
      return DEFAULT_AUTHOR_NAME;
    }
  }

  private async uploadImage(courseId: string, postId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `cursos/${courseId}/posts/${postId}.jpg`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  private async deleteImageIfExists(courseId: string, postId: string): Promise<void> {
    try {
      await deleteObject(ref(storage, `cursos/${courseId}/posts/${postId}.jpg`));
    } catch {
      // No image post
    }
  }

  private postsCollection(courseId: string): CollectionReference {
    return collection(db, COURSES_COLLECTION, courseId, POSTS_SUBCOLLECTION);
  }

  private reactionsCollection(courseId: string, postId: string): CollectionReference {
    return collection(db, COURSES_COLLECTION, courseId, POSTS_SUBCOLLECTION, postId, REACTIONS_SUBCOLLECTION);
  }
}