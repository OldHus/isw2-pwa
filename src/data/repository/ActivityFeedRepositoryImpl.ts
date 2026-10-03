import { collection, limit, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import type { CollectionReference, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { db } from "../firebase/config";
import type { ActivityFeedRepository } from "../../domain/repository/ActivityFeedRepository";
import type { ActivityItem } from "../../domain/model/ActivityFeedModels";
import type { CrashReporter } from "../../domain/service/CrashReporter";

const COURSES_COLLECTION = "cursos";
const POSTS_SUBCOLLECTION = "posts";
const POLLS_SUBCOLLECTION = "encuestas";
const QUIZ_SESSIONS_SUBCOLLECTION = "sesionQuiz";

const MAX_PER_SOURCE = 15;
const MAX_TOTAL = 30;

function truncate(text: string, max = 90): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function postToItem(snapshot: QueryDocumentSnapshot<DocumentData>, courseId: string): ActivityItem {
  const data = snapshot.data();
  const createdAt = data["creadaEn"] as Timestamp | undefined;
  const text = ((data["texto"] as string | undefined) ?? "").trim();
  const authorName = ((data["autorNombre"] as string | undefined) ?? "").trim() || "Profesor";
  return {
    id: `post:${snapshot.id}`,
    type: "post",
    courseId,
    title: `Nueva publicación de ${authorName}`,
    body: text ? truncate(text) : "Hay contenido nuevo en el muro.",
    createdAtMillis: createdAt ? createdAt.toMillis() : 0,
  };
}

function pollToItem(snapshot: QueryDocumentSnapshot<DocumentData>, courseId: string): ActivityItem {
  const data = snapshot.data();
  const createdAt = data["creadaEn"] as Timestamp | undefined;
  const pregunta = ((data["pregunta"] as string | undefined) ?? "").trim();
  return {
    id: `poll:${snapshot.id}`,
    type: "poll",
    courseId,
    title: "Nueva encuesta",
    body: pregunta ? truncate(pregunta) : "Hay una encuesta activa.",
    createdAtMillis: createdAt ? createdAt.toMillis() : 0,
  };
}

function quizToItem(snapshot: QueryDocumentSnapshot<DocumentData>, courseId: string): ActivityItem {
  const data = snapshot.data();
  const launchedAt = data["lanzadaEn"] as Timestamp | undefined;
  const preguntaTexto = ((data["preguntaTexto"] as string | undefined) ?? "").trim();
  return {
    id: `quiz:${snapshot.id}`,
    type: "quiz",
    courseId,
    title: "Nueva pregunta de quiz",
    body: preguntaTexto ? truncate(preguntaTexto) : "Hay una pregunta activa.",
    createdAtMillis: launchedAt ? launchedAt.toMillis() : 0,
  };
}

export class ActivityFeedRepositoryImpl implements ActivityFeedRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  observeCourseActivity(
    courseId: string,
    onChange: (items: ActivityItem[]) => void,
    onError?: (error: unknown) => void
  ): () => void {
    let posts: ActivityItem[] = [];
    let polls: ActivityItem[] = [];
    let quizzes: ActivityItem[] = [];

    let postsReady = false;
    let pollsReady = false;
    let quizzesReady = false;

    const emit = () => {
      if (!postsReady || !pollsReady || !quizzesReady) return;
      const merged = [...posts, ...polls, ...quizzes].sort((a, b) => b.createdAtMillis - a.createdAtMillis);
      onChange(merged.slice(0, MAX_TOTAL));
    };

    const postsCollection = collection(db, COURSES_COLLECTION, courseId, POSTS_SUBCOLLECTION);
    const pollsCollection = collection(db, COURSES_COLLECTION, courseId, POLLS_SUBCOLLECTION);
    const quizCollection = collection(db, COURSES_COLLECTION, courseId, QUIZ_SESSIONS_SUBCOLLECTION);

    const unsubPosts = onSnapshot(
      query(postsCollection as CollectionReference, orderBy("creadaEn", "desc"), limit(MAX_PER_SOURCE)),
      (snapshot) => {
        posts = snapshot.docs.map((d) => postToItem(d, courseId));
        postsReady = true;
        emit();
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(error);
      }
    );

    const unsubPolls = onSnapshot(
      query(pollsCollection as CollectionReference, orderBy("creadaEn", "desc"), limit(MAX_PER_SOURCE)),
      (snapshot) => {
        polls = snapshot.docs.map((d) => pollToItem(d, courseId));
        pollsReady = true;
        emit();
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(error);
      }
    );

    const unsubQuiz = onSnapshot(
      query(quizCollection as CollectionReference, orderBy("lanzadaEn", "desc"), limit(MAX_PER_SOURCE)),
      (snapshot) => {
        quizzes = snapshot.docs.map((d) => quizToItem(d, courseId));
        quizzesReady = true;
        emit();
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(error);
      }
    );

    return () => {
      unsubPosts();
      unsubPolls();
      unsubQuiz();
    };
  }
}