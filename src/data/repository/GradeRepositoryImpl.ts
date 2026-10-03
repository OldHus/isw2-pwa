import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import type { GradeRepository } from "../../domain/repository/GradeRepository";
import type { GradeError, GradeItem, StudentGrades } from "../../domain/model/GradeModels";
import { GradeItemType } from "../../domain/model/GradeModels";
import { success, failure, type AppResult } from "../../domain/model/Result";
import type { CrashReporter } from "../../domain/service/CrashReporter";

const COURSES_COLLECTION = "cursos";
const GRADE_ITEMS_SUBCOLLECTION = "itemsCalificacion";
const GRADES_COLLECTION = "calificaciones";
const STUDENTS_SUBCOLLECTION = "estudiantes";
const NAME_FIELD = "nombre";
const WEIGHT_FIELD = "peso";
const TYPE_FIELD = "tipo";
const ORDER_FIELD = "orden";
const CREATED_AT_FIELD = "creadoEn";
const GRADES_FIELD = "notas";

function unknownGradeError(error: unknown, fallbackMessage: string): GradeError {
  return {
    type: "unknown",
    message: error instanceof Error ? error.message : fallbackMessage,
  };
}

function parseGradesMap(raw: unknown): Record<string, number> {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [itemId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      result[itemId] = value;
    }
  }
  return result;
}

export class GradeRepositoryImpl implements GradeRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  async getGradeItems(courseId: string): Promise<AppResult<GradeItem[], GradeError>> {
    try {
      const itemsRef = collection(db, COURSES_COLLECTION, courseId, GRADE_ITEMS_SUBCOLLECTION);
      const itemsQuery = query(itemsRef, orderBy(ORDER_FIELD));
      const snapshot = await getDocs(itemsQuery);

      const items: GradeItem[] = snapshot.docs.map((itemDoc) => {
        const data = itemDoc.data();
        return {
          id: itemDoc.id,
          name: (data[NAME_FIELD] as string) ?? "",
          weight: (data[WEIGHT_FIELD] as number) ?? 0,
          type: (data[TYPE_FIELD] as string) ?? GradeItemType.DYNAMIC,
          order: (data[ORDER_FIELD] as number) ?? 0,
        };
      });

      return success(items);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudieron cargar los ítems de calificación"));
    }
  }

  async addGradeItem(
    courseId: string,
    name: string,
    weight: number,
    type: string
  ): Promise<AppResult<GradeItem, GradeError>> {
    try {
      const itemsRef = collection(db, COURSES_COLLECTION, courseId, GRADE_ITEMS_SUBCOLLECTION);
      const currentCount = (await getDocs(itemsRef)).size;
      const newDocRef = doc(itemsRef);

      await setDoc(newDocRef, {
        [NAME_FIELD]: name,
        [WEIGHT_FIELD]: weight,
        [TYPE_FIELD]: type,
        [ORDER_FIELD]: currentCount,
        [CREATED_AT_FIELD]: serverTimestamp(),
      });

      return success({ id: newDocRef.id, name, weight, type, order: currentCount });
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudo crear el ítem de calificación"));
    }
  }

    async updateGradeItem(
    courseId: string,
    itemId: string,
    name: string
  ): Promise<AppResult<void, GradeError>> {
    try {
      const itemRef = doc(db, COURSES_COLLECTION, courseId, GRADE_ITEMS_SUBCOLLECTION, itemId);
      await setDoc(itemRef, { [NAME_FIELD]: name }, { merge: true });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudo actualizar el ítem"));
    }
  }

  async deleteGradeItem(courseId: string, itemId: string): Promise<AppResult<void, GradeError>> {
    try {
      const studentsRef = collection(db, GRADES_COLLECTION, courseId, STUDENTS_SUBCOLLECTION);
      const studentsSnapshot = await getDocs(studentsRef);

      const batch = writeBatch(db);
      for (const studentDoc of studentsSnapshot.docs) {
        const grades = parseGradesMap(studentDoc.get(GRADES_FIELD));
        if (itemId in grades) {
          batch.update(studentDoc.ref, { [`${GRADES_FIELD}.${itemId}`]: deleteField() });
        }
      }

      const itemRef = doc(db, COURSES_COLLECTION, courseId, GRADE_ITEMS_SUBCOLLECTION, itemId);
      batch.delete(itemRef);

      await batch.commit();
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudo eliminar el ítem"));
    }
  }

  async getMyGrades(courseId: string): Promise<AppResult<StudentGrades, GradeError>> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return failure({ type: "unknown", message: "Usuario no autenticado" });
    }
    return this.getStudentGrades(courseId, uid);
  }

  async getStudentGrades(
    courseId: string,
    studentUid: string
  ): Promise<AppResult<StudentGrades, GradeError>> {
    try {
      const studentDocRef = doc(db, GRADES_COLLECTION, courseId, STUDENTS_SUBCOLLECTION, studentUid);
      const studentDoc = await getDoc(studentDocRef);

      return success({
        studentUid,
        grades: parseGradesMap(studentDoc.exists() ? studentDoc.get(GRADES_FIELD) : undefined),
      });
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudieron cargar las calificaciones"));
    }
  }

  async setStudentGrade(
    courseId: string,
    studentUid: string,
    itemId: string,
    grade: number
  ): Promise<AppResult<void, GradeError>> {
    try {
      const studentDocRef = doc(db, GRADES_COLLECTION, courseId, STUDENTS_SUBCOLLECTION, studentUid);
      await setDoc(studentDocRef, { [GRADES_FIELD]: { [itemId]: grade } }, { merge: true });

      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudo guardar la calificación"));
    }
  }

  async deleteStudentGrade(
    courseId: string,
    studentUid: string,
    itemId: string
  ): Promise<AppResult<void, GradeError>> {
    try {
      const studentDocRef = doc(db, GRADES_COLLECTION, courseId, STUDENTS_SUBCOLLECTION, studentUid);
      await updateDoc(studentDocRef, { [`${GRADES_FIELD}.${itemId}`]: deleteField() });

      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudo eliminar la calificación"));
    }
  }

  async getAllStudentsGrades(
    courseId: string
  ): Promise<AppResult<Record<string, StudentGrades>, GradeError>> {
    try {
      const studentsRef = collection(db, GRADES_COLLECTION, courseId, STUDENTS_SUBCOLLECTION);
      const snapshot = await getDocs(studentsRef);

      const result: Record<string, StudentGrades> = {};
      for (const studentDoc of snapshot.docs) {
        result[studentDoc.id] = {
          studentUid: studentDoc.id,
          grades: parseGradesMap(studentDoc.get(GRADES_FIELD)),
        };
      }

      return success(result);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(unknownGradeError(error, "No se pudieron cargar las calificaciones del curso"));
    }
  }
}