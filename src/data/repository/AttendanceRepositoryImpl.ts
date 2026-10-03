import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import type { CollectionReference, DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

import { auth, db } from "../firebase/config";
import type { AttendanceError, AttendanceRecord, AttendanceSession } from "../../domain/model/AttendanceModels";
import type { AttendanceRepository } from "../../domain/repository/AttendanceRepository";
import type { CrashReporter } from "../../domain/service/CrashReporter";
import { failure, success } from "../../domain/model/Result";
import type { AppResult } from "../../domain/model/Result";

const COURSES_COLLECTION = "cursos";
const SESSIONS_SUBCOLLECTION = "sesionesAsistencia";
const REGISTRATIONS_SUBCOLLECTION = "registros";

const CODE_FIELD = "codigo";
const ACTIVE_FIELD = "activa";
const DURATION_FIELD = "duracionMinutos";
const CREATED_AT_FIELD = "creadaEn";
const EXPIRES_AT_FIELD = "expiraEn";
const REGISTERED_AT_FIELD = "registradoEn";

function toUnknownError(e: unknown, fallback: string): AttendanceError {
  const message = e instanceof Error ? e.message : fallback;
  return { type: "unknown", message: message || fallback };
}

function toAttendanceSession(snapshot: DocumentSnapshot | QueryDocumentSnapshot): AttendanceSession {
  const data = snapshot.data() ?? {};
  const createdAt = data[CREATED_AT_FIELD] as Timestamp | undefined;
  const expiresAt = data[EXPIRES_AT_FIELD] as Timestamp | undefined;
  return {
    id: snapshot.id,
    code: (data[CODE_FIELD] as string) ?? "",
    isActive: (data[ACTIVE_FIELD] as boolean) ?? false,
    durationMinutes: (data[DURATION_FIELD] as number) ?? 0,
    createdAt: createdAt ? createdAt.toMillis() : 0,
    expiresAt: expiresAt ? expiresAt.toMillis() : 0,
  };
}

function toAttendanceRecord(snapshot: DocumentSnapshot | QueryDocumentSnapshot): AttendanceRecord {
  const data = snapshot.data() ?? {};
  const registeredAt = data[REGISTERED_AT_FIELD] as Timestamp | undefined;
  return {
    studentUid: snapshot.id,
    registeredAt: registeredAt ? registeredAt.toMillis() : 0,
  };
}

export class AttendanceRepositoryImpl implements AttendanceRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  //Teacher

  async startSession(
    courseId: string,
    code: string,
    durationMinutes: number
  ): Promise<AppResult<AttendanceSession, AttendanceError>> {
    try {
      const sessionsRef = this.sessionsCollection(courseId);

      const activeQuery = query(sessionsRef, where(ACTIVE_FIELD, "==", true));
      const activeSnapshot = await getDocs(activeQuery);
      const batch = writeBatch(db);
      activeSnapshot.docs.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, { [ACTIVE_FIELD]: false });
      });

      const newDocRef = doc(sessionsRef);
      const now = Timestamp.now();
      const expiresAt = new Timestamp(now.seconds + durationMinutes * 60, now.nanoseconds);

      const data: DocumentData = {
        [CODE_FIELD]: code,
        [ACTIVE_FIELD]: true,
        [DURATION_FIELD]: durationMinutes,
        [CREATED_AT_FIELD]: now,
        [EXPIRES_AT_FIELD]: expiresAt,
      };
      batch.set(newDocRef, data);
      await batch.commit();

      return success({
        id: newDocRef.id,
        code,
        isActive: true,
        durationMinutes,
        createdAt: now.toMillis(),
        expiresAt: expiresAt.toMillis(),
      });
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo iniciar la sesión de asistencia"));
    }
  }

  async closeSession(courseId: string, sessionId: string): Promise<AppResult<void, AttendanceError>> {
    try {
      const sessionRef = doc(this.sessionsCollection(courseId), sessionId);
      await updateDoc(sessionRef, { [ACTIVE_FIELD]: false });
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo cerrar la sesión"));
    }
  }

  observeSessionRegistrations(
    courseId: string,
    sessionId: string,
    onChange: (records: AttendanceRecord[]) => void,
    onError?: (error: AttendanceError) => void
  ): () => void {
    return onSnapshot(
      this.registrationsCollection(courseId, sessionId),
      (snapshot) => {
        if ("docs" in snapshot) {
          onChange(snapshot.docs.map(toAttendanceRecord));
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudieron cargar los registros"));
      }
    );
  }

  //Shared

  async getActiveSession(courseId: string): Promise<AppResult<AttendanceSession | null, AttendanceError>> {
    try {
      const activeQuery = query(this.sessionsCollection(courseId), where(ACTIVE_FIELD, "==", true), limit(1));
      const snapshot = await getDocs(activeQuery);
      const first = snapshot.docs[0];
      return success(first ? toAttendanceSession(first) : null);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo obtener la sesión activa"));
    }
  }

  observeActiveSession(
    courseId: string,
    onChange: (session: AttendanceSession | null) => void,
    onError?: (error: AttendanceError) => void
  ): () => void {
    const activeQuery = query(this.sessionsCollection(courseId), where(ACTIVE_FIELD, "==", true), limit(1));
    return onSnapshot(
      activeQuery,
      (snapshot) => {
        if ("docs" in snapshot) {
          const first = snapshot.docs[0];
          onChange(first ? toAttendanceSession(first) : null);
        }
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudo cargar la sesión de asistencia"));
      }
    );
  }

  //Student

  async submitAttendance(courseId: string, sessionId: string): Promise<AppResult<void, AttendanceError>> {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      return failure({ type: "unknown", message: "Usuario no autenticado" });
    }

    try {
      const registrationRef = doc(this.registrationsCollection(courseId, sessionId), studentUid);

      const existing = await getDoc(registrationRef);
      if (existing.exists()) {
        return failure({ type: "alreadyRegistered" });
      }

      await setDoc(registrationRef, { [REGISTERED_AT_FIELD]: Timestamp.now() });
      return success(undefined);
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo registrar tu asistencia"));
    }
  }

  async hasSubmittedAttendance(
    courseId: string,
    sessionId: string
  ): Promise<AppResult<boolean, AttendanceError>> {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      return failure({ type: "unknown", message: "Usuario no autenticado" });
    }

    try {
      const registrationRef = doc(this.registrationsCollection(courseId, sessionId), studentUid);
      const snapshot = await getDoc(registrationRef);
      return success(snapshot.exists());
    } catch (e) {
      this.crashReporter.recordException(e);
      return failure(toUnknownError(e, "No se pudo verificar tu asistencia"));
    }
  }

  //Helpers

  private sessionsCollection(courseId: string): CollectionReference {
    return collection(db, COURSES_COLLECTION, courseId, SESSIONS_SUBCOLLECTION);
  }

  private registrationsCollection(courseId: string, sessionId: string): CollectionReference {
    return collection(
      db,
      COURSES_COLLECTION,
      courseId,
      SESSIONS_SUBCOLLECTION,
      sessionId,
      REGISTRATIONS_SUBCOLLECTION
    );
  }
}