import {
    collection,
    deleteDoc,
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
import type {
    CollectionReference,
    DocumentData,
    DocumentReference,
    DocumentSnapshot,
    QueryDocumentSnapshot,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import type { QuizAnswer, QuizError, QuizQuestion, QuizSession, QuizStandingEntry } from "../../domain/model/QuizModels";
import type { QuizRepository } from "../../domain/repository/QuizRepository";
import type { CrashReporter } from "../../domain/service/CrashReporter";
import { failure, success } from "../../domain/model/Result";
import type { AppResult } from "../../domain/model/Result";

const COURSES_COLLECTION = "cursos";
const QUESTION_BANK_SUBCOLLECTION = "bancoPreguntas";
const SESSIONS_SUBCOLLECTION = "sesionQuiz";
const ANSWERS_SUBCOLLECTION = "respuestas";
const PRIVATE_SUBCOLLECTION = "privado";
const ANSWER_KEY_DOC = "clave";
const USERS_COLLECTION = "usuarios";

const QUESTION_TEXT_FIELD = "texto";
const OPTIONS_FIELD = "opciones";
const CORRECT_OPTION_FIELD = "indiceRespuestaCorrecta";
const CREATED_AT_FIELD = "creadaEn";

const SESSION_QUESTION_TEXT_FIELD = "preguntaTexto";
const SESSION_OPTIONS_FIELD = "opciones";
const SESSION_CORRECT_OPTION_FIELD = "indiceRespuestaCorrecta";
const DURATION_FIELD = "duracionSegundos";
const ACTIVE_FIELD = "activa";
const LAUNCHED_AT_FIELD = "lanzadaEn";
const EXPIRES_AT_FIELD = "expiraEn";

const STUDENT_NAME_FIELD = "nombreEstudiante";
const SELECTED_OPTION_FIELD = "indiceSeleccionado";
const RESPONSE_TIME_FIELD = "tiempoRespuestaMs";
const SCORE_FIELD = "puntaje";
const IS_CORRECT_FIELD = "esCorrecta";
const ANSWERED_AT_FIELD = "respondidoEn";

function toUnknownError(e: unknown, fallback: string): QuizError {
    const message = e instanceof Error ? e.message : fallback;
    return { type: "unknown", message: message || fallback };
}

function isPermissionDenied(e: unknown): boolean {
    return (e as { code?: string } | null)?.code === "permission-denied";
}

function toQuizQuestion(snapshot: DocumentSnapshot | QueryDocumentSnapshot): QuizQuestion {
    const data = snapshot.data() ?? {};
    const optionsRaw = data[OPTIONS_FIELD];
    const createdAt = data[CREATED_AT_FIELD] as Timestamp | undefined;
    return {
        id: snapshot.id,
        text: (data[QUESTION_TEXT_FIELD] as string) ?? "",
        options: Array.isArray(optionsRaw) ? optionsRaw.filter((option): option is string => typeof option === "string") : [],
        correctOptionIndex: (data[CORRECT_OPTION_FIELD] as number) ?? 0,
        createdAt: createdAt ? createdAt.toMillis() : 0,
    };
}

function toQuizSession(snapshot: DocumentSnapshot | QueryDocumentSnapshot): QuizSession {
    const data = snapshot.data() ?? {};
    const optionsRaw = data[SESSION_OPTIONS_FIELD];
    const launchedAt = data[LAUNCHED_AT_FIELD] as Timestamp | undefined;
    const expiresAt = data[EXPIRES_AT_FIELD] as Timestamp | undefined;
    const correctOption: unknown = data[SESSION_CORRECT_OPTION_FIELD];
    return {
        id: snapshot.id,
        questionText: (data[SESSION_QUESTION_TEXT_FIELD] as string) ?? "",
        options: Array.isArray(optionsRaw) ? optionsRaw.filter((option): option is string => typeof option === "string") : [],
        correctOptionIndex: typeof correctOption === "number" ? correctOption : null,
        durationSeconds: (data[DURATION_FIELD] as number) ?? 0,
        isActive: (data[ACTIVE_FIELD] as boolean) ?? false,
        launchedAt: launchedAt ? launchedAt.toMillis() : 0,
        expiresAt: expiresAt ? expiresAt.toMillis() : 0,
    };
}

function toQuizAnswer(snapshot: DocumentSnapshot | QueryDocumentSnapshot): QuizAnswer {
    const data = snapshot.data() ?? {};
    const answeredAt = data[ANSWERED_AT_FIELD] as Timestamp | undefined;
    const studentName = ((data[STUDENT_NAME_FIELD] as string) ?? "").trim();
    const isCorrect: unknown = data[IS_CORRECT_FIELD];
    return {
        studentUid: snapshot.id,
        studentName: studentName.length > 0 ? studentName : snapshot.id,
        selectedOptionIndex: (data[SELECTED_OPTION_FIELD] as number) ?? -1,
        responseTimeMillis: (data[RESPONSE_TIME_FIELD] as number) ?? 0,
        score: (data[SCORE_FIELD] as number) ?? 0,
        isCorrect: typeof isCorrect === "boolean" ? isCorrect : null,
        answeredAt: answeredAt ? answeredAt.toMillis() : 0,
    };
}

type SessionAnswersSubscriber = (
    sessionId: string,
    onAnswers: (answers: QuizAnswer[]) => void,
    onError: (error: unknown) => void
) => () => void;

function buildStanding(answersBySession: Map<string, QuizAnswer[]>): QuizStandingEntry[] {
    const totals = new Map<string, { studentName: string; totalScore: number; latestAnsweredAt: number }>();
    answersBySession.forEach((answers) => {
        answers.forEach((answer) => {
            const current = totals.get(answer.studentUid);
            if (!current) {
                totals.set(answer.studentUid, {
                    studentName: answer.studentName,
                    totalScore: answer.score,
                    latestAnsweredAt: answer.answeredAt,
                });
                return;
            }
            current.totalScore += answer.score;
            if (answer.answeredAt >= current.latestAnsweredAt) {
                current.studentName = answer.studentName;
                current.latestAnsweredAt = answer.answeredAt;
            }
        });
    });
    return Array.from(totals.entries())
        .map(([studentUid, total]) => ({
            studentUid,
            studentName: total.studentName,
            totalScore: total.totalScore,
        }))
        .sort((a, b) => b.totalScore - a.totalScore || a.studentName.localeCompare(b.studentName));
}

export class QuizRepositoryImpl implements QuizRepository {
    private crashReporter: CrashReporter;

    constructor(crashReporter: CrashReporter) {
        this.crashReporter = crashReporter;
    }

    //Question bank

    async getQuestionBank(courseId: string): Promise<AppResult<QuizQuestion[], QuizError>> {
        try {
            const bankQuery = query(this.bankCollection(courseId), orderBy(CREATED_AT_FIELD, "desc"));
            const snapshot = await getDocs(bankQuery);
            return success(snapshot.docs.map(toQuizQuestion));
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo cargar el banco de preguntas"));
        }
    }

    async createQuestion(
        courseId: string,
        text: string,
        options: string[],
        correctOptionIndex: number
    ): Promise<AppResult<QuizQuestion, QuizError>> {
        try {
            const docRef = doc(this.bankCollection(courseId));
            const now = Timestamp.now();
            await setDoc(docRef, {
                [QUESTION_TEXT_FIELD]: text,
                [OPTIONS_FIELD]: options,
                [CORRECT_OPTION_FIELD]: correctOptionIndex,
                [CREATED_AT_FIELD]: now,
            });
            return success({
                id: docRef.id,
                text,
                options,
                correctOptionIndex,
                createdAt: now.toMillis(),
            });
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo crear la pregunta"));
        }
    }

    async updateQuestion(
        courseId: string,
        questionId: string,
        text: string,
        options: string[],
        correctOptionIndex: number
    ): Promise<AppResult<void, QuizError>> {
        try {
            const questionRef = doc(this.bankCollection(courseId), questionId);
            await updateDoc(questionRef, {
                [QUESTION_TEXT_FIELD]: text,
                [OPTIONS_FIELD]: options,
                [CORRECT_OPTION_FIELD]: correctOptionIndex,
            });
            return success(undefined);
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo editar la pregunta"));
        }
    }

    async deleteQuestion(courseId: string, questionId: string): Promise<AppResult<void, QuizError>> {
        try {
            await deleteDoc(doc(this.bankCollection(courseId), questionId));
            return success(undefined);
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo eliminar la pregunta"));
        }
    }

    //Live session (teacher)

    async launchQuestion(
        courseId: string,
        question: QuizQuestion,
        durationSeconds: number
    ): Promise<AppResult<QuizSession, QuizError>> {
        try {
            const sessionsRef = this.sessionsCollection(courseId);

            const activeQuery = query(sessionsRef, where(ACTIVE_FIELD, "==", true));
            const activeSnapshot = await getDocs(activeQuery);
            const closingUpdates = await Promise.all(
                activeSnapshot.docs.map((docSnapshot) => this.buildClosingUpdate(courseId, docSnapshot.id))
            );
            const batch = writeBatch(db);
            activeSnapshot.docs.forEach((docSnapshot, index) => {
                batch.update(docSnapshot.ref, closingUpdates[index]);
            });

            const newDocRef = doc(sessionsRef);
            const now = Timestamp.now();
            const expiresAt = Timestamp.fromDate(new Date(now.toMillis() + durationSeconds * 1000));

            const data: DocumentData = {
                [SESSION_QUESTION_TEXT_FIELD]: question.text,
                [SESSION_OPTIONS_FIELD]: question.options,
                [DURATION_FIELD]: durationSeconds,
                [ACTIVE_FIELD]: true,
                [LAUNCHED_AT_FIELD]: now,
                [EXPIRES_AT_FIELD]: expiresAt,
            };
            batch.set(newDocRef, data);
            batch.set(this.answerKeyDoc(courseId, newDocRef.id), {
                [SESSION_CORRECT_OPTION_FIELD]: question.correctOptionIndex,
            });
            await batch.commit();

            return success({
                id: newDocRef.id,
                questionText: question.text,
                options: question.options,
                correctOptionIndex: question.correctOptionIndex,
                durationSeconds,
                isActive: true,
                launchedAt: now.toMillis(),
                expiresAt: expiresAt.toMillis(),
            });
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo lanzar la pregunta"));
        }
    }

    async closeSession(courseId: string, sessionId: string): Promise<AppResult<void, QuizError>> {
        try {
            const sessionRef = doc(this.sessionsCollection(courseId), sessionId);
            await updateDoc(sessionRef, await this.buildClosingUpdate(courseId, sessionId));
            return success(undefined);
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo cerrar la pregunta"));
        }
    }

    //Shared

    observeLatestSession(
        courseId: string,
        onChange: (session: QuizSession | null) => void,
        onError?: (error: QuizError) => void
    ): () => void {
        const latestQuery = query(this.sessionsCollection(courseId), orderBy(LAUNCHED_AT_FIELD, "desc"), limit(1));
        return onSnapshot(
            latestQuery,
            (snapshot) => {
                if ("docs" in snapshot) {
                    const first = snapshot.docs[0];
                    onChange(first ? toQuizSession(first) : null);
                }
            },
            (error) => {
                this.crashReporter.recordException(error);
                onError?.(toUnknownError(error, "No se pudo cargar la pregunta"));
            }
        );
    }

    observeSessionAnswers(
        courseId: string,
        sessionId: string,
        onChange: (answers: QuizAnswer[]) => void,
        onError?: (error: QuizError) => void
    ): () => void {
        return onSnapshot(
            this.answersCollection(courseId, sessionId),
            (snapshot) => {
                if ("docs" in snapshot) {
                    onChange(snapshot.docs.map(toQuizAnswer));
                }
            },
            (error) => {
                this.crashReporter.recordException(error);
                onError?.(toUnknownError(error, "No se pudieron cargar las respuestas"));
            }
        );
    }

    //Student

    async submitAnswer(
        courseId: string,
        session: QuizSession,
        selectedOptionIndex: number
    ): Promise<AppResult<void, QuizError>> {
        const studentUid = auth.currentUser?.uid;
        if (!studentUid) {
            return failure({ type: "unknown", message: "Usuario no autenticado" });
        }

        try {
            const ownProfileSnapshot = await getDoc(doc(collection(db, USERS_COLLECTION), studentUid));
            const ownProfile = ownProfileSnapshot.data() as DocumentData | undefined;
            const profileName = ((ownProfile?.["nombre"] as string | undefined) ?? "").trim();
            const studentName = profileName.length > 0 ? profileName : auth.currentUser?.email ?? studentUid;

            const answerRef = doc(this.answersCollection(courseId, session.id), studentUid);
            await setDoc(answerRef, {
                [STUDENT_NAME_FIELD]: studentName,
                [SELECTED_OPTION_FIELD]: selectedOptionIndex,
                [ANSWERED_AT_FIELD]: Timestamp.now(),
            });
            return success(undefined);
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo registrar tu respuesta"));
        }
    }

    observeMyAnswer(
        courseId: string,
        sessionId: string,
        onChange: (answer: QuizAnswer | null) => void,
        onError?: (error: QuizError) => void
    ): () => void {
        const studentUid = auth.currentUser?.uid;
        if (!studentUid) {
            onError?.({ type: "unknown", message: "Usuario no autenticado" });
            return () => { };
        }
        const answerRef = doc(this.answersCollection(courseId, sessionId), studentUid);
        return onSnapshot(
            answerRef,
            (snapshot) => {
                if (!("docs" in snapshot)) {
                    onChange(snapshot.exists() ? toQuizAnswer(snapshot) : null);
                }
            },
            (error) => {
                this.crashReporter.recordException(error);
                onError?.(toUnknownError(error, "No se pudo cargar tu respuesta"));
            }
        );
    }

    observeCourseStanding(
        courseId: string,
        onChange: (standing: QuizStandingEntry[]) => void,
        onError?: (error: QuizError) => void
    ): () => void {
        return this.observeStandingFromAnswers(
            courseId,
            (sessionId, onAnswers, onAnswersError) =>
                onSnapshot(
                    this.answersCollection(courseId, sessionId),
                    (snapshot) => onAnswers(snapshot.docs.map(toQuizAnswer)),
                    onAnswersError
                ),
            onChange,
            (error) => {
                this.crashReporter.recordException(error);
                onError?.(toUnknownError(error, "No se pudo cargar el ranking acumulado"));
            }
        );
    }

    observeMyStanding(
        courseId: string,
        onChange: (entry: QuizStandingEntry | null) => void,
        onError?: (error: QuizError) => void
    ): () => void {
        const studentUid = auth.currentUser?.uid;
        if (!studentUid) {
            onError?.({ type: "unknown", message: "Usuario no autenticado" });
            return () => { };
        }
        return this.observeStandingFromAnswers(
            courseId,
            (sessionId, onAnswers, onAnswersError) =>
                onSnapshot(
                    doc(this.answersCollection(courseId, sessionId), studentUid),
                    (snapshot) => onAnswers(snapshot.exists() ? [toQuizAnswer(snapshot)] : []),
                    onAnswersError
                ),
            (standing) => onChange(standing[0] ?? null),
            (error) => {
                this.crashReporter.recordException(error);
                onError?.(toUnknownError(error, "No se pudo cargar tu puntaje acumulado"));
            }
        );
    }

    async resetCourseStanding(courseId: string): Promise<AppResult<void, QuizError>> {
        try {
            const sessionsSnapshot = await getDocs(this.sessionsCollection(courseId));
            const answersSnapshots = await Promise.all(
                sessionsSnapshot.docs.map((sessionSnapshot) =>
                    getDocs(this.answersCollection(courseId, sessionSnapshot.id))
                )
            );

            await Promise.all(
                answersSnapshots.flatMap((answersSnapshot) =>
                    answersSnapshot.docs.map((answerSnapshot) => deleteDoc(answerSnapshot.ref))
                )
            );
            await Promise.all(
                sessionsSnapshot.docs.map((sessionSnapshot) => deleteDoc(this.answerKeyDoc(courseId, sessionSnapshot.id)))
            );
            await Promise.all(sessionsSnapshot.docs.map((sessionSnapshot) => deleteDoc(sessionSnapshot.ref)));

            return success(undefined);
        } catch (e) {
            this.crashReporter.recordException(e);
            return failure(toUnknownError(e, "No se pudo reiniciar el ranking acumulado"));
        }
    }

    //Helpers

    private observeStandingFromAnswers(
        courseId: string,
        subscribeToSessionAnswers: SessionAnswersSubscriber,
        onChange: (standing: QuizStandingEntry[]) => void,
        onError: (error: unknown) => void
    ): () => void {
        const answersBySession = new Map<string, QuizAnswer[]>();
        const answerUnsubscribers = new Map<string, () => void>();
        const deniedSessions = new Set<string>();

        const emitIfReady = () => {
            if (answersBySession.size < answerUnsubscribers.size) return;
            onChange(buildStanding(answersBySession));
        };

        const stopSession = (sessionId: string) => {
            answerUnsubscribers.get(sessionId)?.();
            answerUnsubscribers.delete(sessionId);
            answersBySession.delete(sessionId);
            deniedSessions.delete(sessionId);
        };

        const unsubscribeSessions = onSnapshot(
            this.sessionsCollection(courseId),
            (snapshot) => {
                const sessionIds = new Set(snapshot.docs.map((docSnapshot) => docSnapshot.id));

                Array.from(answerUnsubscribers.keys())
                    .filter((sessionId) => !sessionIds.has(sessionId))
                    .forEach(stopSession);

                // Algo cambió en las sesiones (por ejemplo, se cerró una pregunta):
                // se vuelven a pedir las respuestas que antes no se podían leer.
                Array.from(deniedSessions).forEach(stopSession);

                sessionIds.forEach((sessionId) => {
                    if (answerUnsubscribers.has(sessionId)) return;
                    answerUnsubscribers.set(
                        sessionId,
                        subscribeToSessionAnswers(
                            sessionId,
                            (answers) => {
                                if (!answerUnsubscribers.has(sessionId)) return;
                                answersBySession.set(sessionId, answers);
                                emitIfReady();
                            },
                            (error) => {
                                if (!answerUnsubscribers.has(sessionId)) return;
                                if (!isPermissionDenied(error)) {
                                    onError(error);
                                    return;
                                }
                                deniedSessions.add(sessionId);
                                answersBySession.set(sessionId, []);
                                emitIfReady();
                            }
                        )
                    );
                });

                emitIfReady();
            },
            onError
        );

        return () => {
            unsubscribeSessions();
            Array.from(answerUnsubscribers.keys()).forEach(stopSession);
        };
    }

    private async buildClosingUpdate(courseId: string, sessionId: string): Promise<DocumentData> {
        const update: DocumentData = { [ACTIVE_FIELD]: false };
        const keySnapshot = await getDoc(this.answerKeyDoc(courseId, sessionId));
        const correctOption: unknown = keySnapshot.data()?.[SESSION_CORRECT_OPTION_FIELD];
        if (typeof correctOption === "number") {
            update[SESSION_CORRECT_OPTION_FIELD] = correctOption;
        }
        return update;
    }

    private answerKeyDoc(courseId: string, sessionId: string): DocumentReference {
        return doc(this.sessionsCollection(courseId), sessionId, PRIVATE_SUBCOLLECTION, ANSWER_KEY_DOC);
    }

    private bankCollection(courseId: string): CollectionReference {
        return collection(db, COURSES_COLLECTION, courseId, QUESTION_BANK_SUBCOLLECTION);
    }

    private sessionsCollection(courseId: string): CollectionReference {
        return collection(db, COURSES_COLLECTION, courseId, SESSIONS_SUBCOLLECTION);
    }

    private answersCollection(courseId: string, sessionId: string): CollectionReference {
        return collection(db, COURSES_COLLECTION, courseId, SESSIONS_SUBCOLLECTION, sessionId, ANSWERS_SUBCOLLECTION);
    }
}