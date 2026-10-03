import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import type { TeamRepository } from "../../domain/repository/TeamRepository";
import {
  parseTaskColumn,
  TaskColumn,
  type KanbanTask,
  type TaskColumnValue,
  type TaskError,
  type Team,
  type TeamError,
} from "../../domain/model/TeamModels";
import { success, failure, type AppResult } from "../../domain/model/Result";
import type { CrashReporter } from "../../domain/service/CrashReporter";

const COURSES_COLLECTION = "cursos";
const TEAMS_SUBCOLLECTION = "equipos";
const TASKS_SUBCOLLECTION = "tareas";

const NAME_FIELD = "nombre";
const MEMBERS_FIELD = "integrantesUids";
const CREATED_AT_FIELD = "creadoEn";

const TITLE_FIELD = "titulo";
const DESCRIPTION_FIELD = "descripcion";
const COLUMN_FIELD = "columna";
const CREATED_BY_FIELD = "creadaPorUid";
const ORDER_FIELD = "orden";
const TASK_CREATED_AT_FIELD = "creadaEn";
const TASK_UPDATED_AT_FIELD = "actualizadaEn";

export class TeamRepositoryImpl implements TeamRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  //Teams

  async createTeam(courseId: string, name: string): Promise<AppResult<Team, TeamError>> {
    try {
      const newDocRef = doc(this.teamsCollection(courseId));
      const now = Timestamp.now();

      await setDoc(newDocRef, {
        [NAME_FIELD]: name,
        [MEMBERS_FIELD]: [],
        [CREATED_AT_FIELD]: now,
      });

      return success({ id: newDocRef.id, name, memberUids: [], createdAt: now.toMillis() });
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo crear el equipo",
      });
    }
  }

  async getCourseTeams(courseId: string): Promise<AppResult<Team[], TeamError>> {
    try {
      const snapshot = await getDocs(this.teamsCollection(courseId));
      return success(snapshot.docs.map((teamDoc) => this.toTeam(teamDoc)));
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudieron cargar los equipos",
      });
    }
  }

  async getTeamById(courseId: string, teamId: string): Promise<AppResult<Team, TeamError>> {
    try {
      const teamDoc = await getDoc(doc(this.teamsCollection(courseId), teamId));
      if (!teamDoc.exists()) {
        return failure({ type: "teamNotFound" });
      }
      return success(this.toTeam(teamDoc));
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo cargar el equipo",
      });
    }
  }

  async addStudentToTeam(
    courseId: string,
    teamId: string,
    studentUid: string
  ): Promise<AppResult<void, TeamError>> {
    try {
      await updateDoc(doc(this.teamsCollection(courseId), teamId), {
        [MEMBERS_FIELD]: arrayUnion(studentUid),
      });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo agregar el estudiante al equipo",
      });
    }
  }

  async removeStudentFromTeam(
    courseId: string,
    teamId: string,
    studentUid: string
  ): Promise<AppResult<void, TeamError>> {
    try {
      await updateDoc(doc(this.teamsCollection(courseId), teamId), {
        [MEMBERS_FIELD]: arrayRemove(studentUid),
      });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo quitar el estudiante del equipo",
      });
    }
  }

  async getMyTeam(courseId: string): Promise<AppResult<Team | null, TeamError>> {
    const studentUid = auth.currentUser?.uid;
    if (!studentUid) {
      return failure({ type: "unknown", message: "Usuario no autenticado" });
    }

    try {
      const teamsQuery = query(this.teamsCollection(courseId), where(MEMBERS_FIELD, "array-contains", studentUid));
      const snapshot = await getDocs(teamsQuery);
      const first = snapshot.docs[0];
      return success(first ? this.toTeam(first) : null);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo cargar tu equipo",
      });
    }
  }

  async renameTeam(courseId: string, teamId: string, newName: string): Promise<AppResult<void, TeamError>> {
    try {
      await updateDoc(doc(this.teamsCollection(courseId), teamId), { [NAME_FIELD]: newName });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo renombrar el equipo",
      });
    }
  }

  async deleteTeam(courseId: string, teamId: string): Promise<AppResult<void, TeamError>> {
    try {
      const tasksSnapshot = await getDocs(this.tasksCollection(courseId, teamId));
      const batch = writeBatch(db);
      tasksSnapshot.docs.forEach((taskDoc) => batch.delete(taskDoc.ref));
      batch.delete(doc(this.teamsCollection(courseId), teamId));
      await batch.commit();

      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo eliminar el equipo",
      });
    }
  }

  //Tasks

  async getTeamTasks(courseId: string, teamId: string): Promise<AppResult<KanbanTask[], TaskError>> {
    try {
      const tasksQuery = query(this.tasksCollection(courseId, teamId), orderBy(ORDER_FIELD));
      const snapshot = await getDocs(tasksQuery);
      return success(snapshot.docs.map((taskDoc) => this.toKanbanTask(taskDoc, teamId)));
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudieron cargar las tareas del equipo",
      });
    }
  }

  async createTask(
    courseId: string,
    teamId: string,
    title: string,
    description: string
  ): Promise<AppResult<KanbanTask, TaskError>> {
    const createdByUid = auth.currentUser?.uid;
    if (!createdByUid) {
      return failure({ type: "notAuthenticated" });
    }

    try {
      const tasksRef = this.tasksCollection(courseId, teamId);
      const currentCount = (await getDocs(tasksRef)).size;
      const newDocRef = doc(tasksRef);
      const now = Timestamp.now();

      await setDoc(newDocRef, {
        [TITLE_FIELD]: title,
        [DESCRIPTION_FIELD]: description,
        [COLUMN_FIELD]: TaskColumn.PROPUESTAS,
        [CREATED_BY_FIELD]: createdByUid,
        [ORDER_FIELD]: currentCount,
        [TASK_CREATED_AT_FIELD]: now,
        [TASK_UPDATED_AT_FIELD]: now,
      });

      return success({
        id: newDocRef.id,
        teamId,
        title,
        description,
        column: TaskColumn.PROPUESTAS,
        createdByUid,
        order: currentCount,
        createdAt: now.toMillis(),
        updatedAt: now.toMillis(),
      });
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo crear la tarea",
      });
    }
  }

  async moveTask(
    courseId: string,
    teamId: string,
    taskId: string,
    newColumn: TaskColumnValue
  ): Promise<AppResult<void, TaskError>> {
    try {
      await updateDoc(doc(this.tasksCollection(courseId, teamId), taskId), {
        [COLUMN_FIELD]: newColumn,
        [TASK_UPDATED_AT_FIELD]: Timestamp.now(),
      });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo mover la tarea",
      });
    }
  }

  async deleteTask(courseId: string, teamId: string, taskId: string): Promise<AppResult<void, TaskError>> {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(this.tasksCollection(courseId, teamId), taskId));
      await batch.commit();
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo eliminar la tarea",
      });
    }
  }

  //Helpers

  private teamsCollection(courseId: string) {
    return collection(db, COURSES_COLLECTION, courseId, TEAMS_SUBCOLLECTION);
  }

  private tasksCollection(courseId: string, teamId: string) {
    return collection(db, COURSES_COLLECTION, courseId, TEAMS_SUBCOLLECTION, teamId, TASKS_SUBCOLLECTION);
  }

  private toTeam(snapshot: DocumentSnapshot | QueryDocumentSnapshot): Team {
    const data = snapshot.data() ?? {};
    const membersRaw = data[MEMBERS_FIELD];
    const memberUids = Array.isArray(membersRaw) ? membersRaw.filter((value): value is string => typeof value === "string") : [];
    const createdAt = data[CREATED_AT_FIELD];

    return {
      id: snapshot.id,
      name: (data[NAME_FIELD] as string) ?? "",
      memberUids,
      createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : 0,
    };
  }

  private toKanbanTask(snapshot: DocumentSnapshot | QueryDocumentSnapshot, teamId: string): KanbanTask {
    const data = snapshot.data() ?? {};
    const createdAt = data[TASK_CREATED_AT_FIELD];
    const updatedAt = data[TASK_UPDATED_AT_FIELD];

    return {
      id: snapshot.id,
      teamId,
      title: (data[TITLE_FIELD] as string) ?? "",
      description: (data[DESCRIPTION_FIELD] as string) ?? "",
      column: parseTaskColumn((data[COLUMN_FIELD] as string) ?? ""),
      createdByUid: (data[CREATED_BY_FIELD] as string) ?? "",
      order: typeof data[ORDER_FIELD] === "number" ? (data[ORDER_FIELD] as number) : 0,
      createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : 0,
      updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : 0,
    };
  }
}