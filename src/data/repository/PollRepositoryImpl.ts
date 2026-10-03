import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import type { CollectionReference, DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

import { auth, db } from "../firebase/config";
import type { Poll, PollError, PollVote } from "../../domain/model/PollModels";
import type { PollRepository } from "../../domain/repository/PollRepository";
import type { CrashReporter } from "../../domain/service/CrashReporter";
import { failure, success } from "../../domain/model/Result";
import type { AppResult } from "../../domain/model/Result";

const COURSES_COLLECTION = "cursos";
const POLLS_SUBCOLLECTION = "encuestas";
const VOTES_SUBCOLLECTION = "votos";
const USERS_COLLECTION = "usuarios";

const QUESTION_FIELD = "pregunta";
const OPTIONS_FIELD = "opciones";
const ACTIVE_FIELD = "activa";
const CREATED_AT_FIELD = "creadaEn";
const EXPIRES_AT_FIELD = "expiraEn";
const OPTION_INDEX_FIELD = "opcionIndex";
const VOTED_AT_FIELD = "votadoEn";
const STUDENT_NAME_FIELD = "nombreEstudiante";

function toUnknownError(e: unknown, fallback: string): PollError {
  const message = e instanceof Error ? e.message : fallback;
  return { type: "unknown", message: message || fallback };
}

function toPoll(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Poll {
  const data = snapshot.data() ?? {};
  const optionsRaw = data[OPTIONS_FIELD];
  const createdAt = data[CREATED_AT_FIELD] as Timestamp | undefined;
  const expiresAt = data[EXPIRES_AT_FIELD] as Timestamp | undefined;
  return {
    id: snapshot.id,
    question: (data[QUESTION_FIELD] as string) ?? "",
    options: Array.isArray(optionsRaw) ? optionsRaw.filter((option): option is string => typeof option === "string") : [],
    isActive: (data[ACTIVE_FIELD] as boolean) ?? false,
    createdAt: createdAt ? createdAt.toMillis() : 0,
    expiresAt: expiresAt ? expiresAt.toMillis() : 0,
  };
}

function toPollVote(snapshot: DocumentSnapshot | QueryDocumentSnapshot): PollVote {
  const data = snapshot.data() ?? {};
  const votedAt = data[VOTED_AT_FIELD] as Timestamp | undefined;
  const studentName = ((data[STUDENT_NAME_FIELD] as string) ?? "").trim();
  return {
    studentUid: snapshot.id,
    studentName: studentName.length > 0 ? studentName : snapshot.id,
    optionIndex: (data[OPTION_INDEX_FIELD] as number) ?? -1,
    votedAt: votedAt ? votedAt.toMillis() : 0,
  };
}

export class PollRepositoryImpl implements PollRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  //Teacher

  async startPoll(
    courseId: string,
    question: string,
    options: string[],
    expiresAtMillis: number
  ): Promise<AppResult<Poll, PollError>> {
    try {
      const pollsRef = this.pollsCollection(courseId);

      const activeQuery = query(pollsRef, where(ACTIVE_FIELD, "==", true));
      const activeSnapshot = await getDocs(activeQuery);
      const batch = writeBatch(db);
      activeSnapshot.docs.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, { [ACTIVE_FIELD]: false });
      });

      const newDocRef = doc(pollsRef);
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromDate(new Date(expiresAtMillis));

      const data: DocumentData = {
        [QUESTION_FIELD]: question,
        [OPTIONS_FIELD]: options,
        [ACTIVE_FIELD]: true,
        [CREATED_AT_FIELD]: now,
        [EXPIRES_AT_FIELD]: expiresAt,
      };
      batch.set(newDocRef, data);
      await batch.commit();

      return success({
        id: newDocRef.id,
        question,
        options,
        isActive: true,
        createdAt: now.toMillis(),
        expiresAt: expiresAt.toMillis(),
      });
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo crear la encuesta"));
    }
  }

  async closePoll(courseId: string, pollId: string): Promise<AppResult<void, PollError>> {
    try {
      const pollRef = doc(this.pollsCollection(courseId), pollId);
      await updateDoc(pollRef, { [ACTIVE_FIELD]: false });
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo cerrar la encuesta"));
    }
  }

  //Shared

  observeLatestPoll(
    courseId: string,
    onChange: (poll: Poll | null) => void,
    onError?: (error: PollError) => void
  ): () => void {
    const latestQuery = query(this.pollsCollection(courseId), orderBy(CREATED_AT_FIELD, "desc"), limit(1));
    return onSnapshot(
      latestQuery,
      (snapshot) => {
        if ("docs" in snapshot) {
          const first = snapshot.docs[0];
          onChange(first ? toPoll(first) : null);
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudo cargar la encuesta"));
      }
    );
  }

  observePollVotes(
    courseId: string,
    pollId: string,
    onChange: (votes: PollVote[]) => void,
    onError?: (error: PollError) => void
  ): () => void {
    return onSnapshot(
      this.votesCollection(courseId, pollId),
      (snapshot) => {
        if ("docs" in snapshot) {
          onChange(snapshot.docs.map(toPollVote));
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudieron cargar los votos"));
      }
    );
  }

  //Student

  async submitVote(courseId: string, pollId: string, optionIndex: number): Promise<AppResult<void, PollError>> {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      return failure({ type: "notAuthenticated" });
    }

    try {
      const ownProfileSnapshot = await getDoc(doc(collection(db, USERS_COLLECTION), studentUid));
      const ownProfile = ownProfileSnapshot.data() as DocumentData | undefined;
      const profileName = ((ownProfile?.["nombre"] as string | undefined) ?? "").trim();
      const studentName = profileName.length > 0 ? profileName : auth.currentUser?.email ?? studentUid;

      const voteRef = doc(this.votesCollection(courseId, pollId), studentUid);
      await setDoc(voteRef, {
        [OPTION_INDEX_FIELD]: optionIndex,
        [VOTED_AT_FIELD]: Timestamp.now(),
        [STUDENT_NAME_FIELD]: studentName,
      });
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo registrar tu voto"));
    }
  }

  observeMyVote(
    courseId: string,
    pollId: string,
    onChange: (vote: PollVote | null) => void,
    onError?: (error: PollError) => void
  ): () => void {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      onError?.({ type: "notAuthenticated" });
      return () => {};
    }
    const voteRef = doc(this.votesCollection(courseId, pollId), studentUid);
    return onSnapshot(
      voteRef,
      (snapshot) => {
        if (!("docs" in snapshot)) {
          onChange(snapshot.exists() ? toPollVote(snapshot) : null);
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudo cargar tu voto"));
      }
    );
  }

  //Helpers

  private pollsCollection(courseId: string): CollectionReference {
    return collection(db, COURSES_COLLECTION, courseId, POLLS_SUBCOLLECTION);
  }

  private votesCollection(courseId: string, pollId: string): CollectionReference {
    return collection(db, COURSES_COLLECTION, courseId, POLLS_SUBCOLLECTION, pollId, VOTES_SUBCOLLECTION);
  }
}