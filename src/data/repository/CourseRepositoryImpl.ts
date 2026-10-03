import { collection, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { uploadProfilePhotoFile } from "../storage/uploadProfilePhotoFile";
import type { CourseRepository } from "../../domain/repository/CourseRepository";
import type { Course, CourseError, CourseStudent } from "../../domain/model/CourseModels";
import type { RegistrationResult, RegistrationError } from "../../domain/model/RegistrationModels";
import { success, failure, type AppResult } from "../../domain/model/Result";
import type { CrashReporter } from "../../domain/service/CrashReporter";

const COURSES_COLLECTION = "cursos";
const USERS_COLLECTION = "usuarios";
const NAME_FIELD = "nombre";
const ACCESS_CODE_FIELD = "codigoAcceso";
const TEACHER_UID_FIELD = "docenteUid";
const SYLLABUS_PATH_FIELD = "syllabusPdfPath";
const EMAIL_FIELD = "correo";
const PHOTO_URL_FIELD = "fotoUrl";
const ROLE_FIELD = "rol";
const COURSE_ID_FIELD = "cursoId";
const STUDENT_ROLE = "estudiante";

const ACCESS_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ACCESS_CODE_LENGTH = 6;

export class CourseRepositoryImpl implements CourseRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  async getCourse(courseId: string): Promise<AppResult<Course, CourseError>> {
    try {
      const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
      const courseDoc = await getDoc(courseDocRef);

      if (!courseDoc.exists()) {
        return failure({ type: "notFound" });
      }

      const data = courseDoc.data();
      if (!data) {
        return failure({ type: "notFound" });
      }
      return success({
        id: courseDoc.id,
        name: (data[NAME_FIELD] as string) ?? "",
        accessCode: (data[ACCESS_CODE_FIELD] as string) ?? "",
        teacherUid: (data[TEACHER_UID_FIELD] as string) ?? "",
        syllabusPdfPath: (data[SYLLABUS_PATH_FIELD] as string) ?? "",
      });
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "Unknown error while fetching course",
      });
    }
  }

  async getCourseStudents(courseId: string): Promise<AppResult<CourseStudent[], CourseError>> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const studentsQuery = query(
        usersRef,
        where(COURSE_ID_FIELD, "==", courseId),
        where(ROLE_FIELD, "==", STUDENT_ROLE)
      );
      const snapshot = await getDocs(studentsQuery);

      const students: CourseStudent[] = snapshot.docs.map((studentDoc) => {
        const data = studentDoc.data();
        return {
          uid: studentDoc.id,
          name: (data[NAME_FIELD] as string) ?? "",
          email: (data[EMAIL_FIELD] as string) ?? "",
          photoUrl: (data[PHOTO_URL_FIELD] as string) ?? "",
        };
      });

      return success(students);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo cargar la lista de estudiantes",
      });
    }
  }

  async redeemRegistrationCode(
    code: string,
    photoFile?: File | null
  ): Promise<AppResult<RegistrationResult, RegistrationError>> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return failure({ type: "userNotAuthenticated" });
      }

      const coursesRef = collection(db, COURSES_COLLECTION);
      const codeQuery = query(coursesRef, where(ACCESS_CODE_FIELD, "==", code), limit(1));
      const snapshot = await getDocs(codeQuery);
      const courseDoc = snapshot.docs[0];

      if (!courseDoc) {
        return failure({ type: "invalidCode" });
      }

      const courseId = courseDoc.id;
      const name = currentUser.displayName ?? "";
      const photoUrl = photoFile 
      ? await uploadProfilePhotoFile(currentUser.uid, photoFile) : "";

      const userProfile = {
        [NAME_FIELD]: name,
        [EMAIL_FIELD]: currentUser.email ?? "",
        [PHOTO_URL_FIELD]: photoUrl,
        [ROLE_FIELD]: STUDENT_ROLE,
        [COURSE_ID_FIELD]: courseId,
      };

      await setDoc(doc(db, USERS_COLLECTION, currentUser.uid), userProfile);

      return success({ uid: currentUser.uid, role: STUDENT_ROLE, courseId, name, photoUrl });
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo canjear el código",
      });
    }
  }

  async regenerateAccessCode(courseId: string): Promise<AppResult<string, CourseError>> {
    try {
      const newCode = this.generateAccessCode();
      await updateDoc(doc(db, COURSES_COLLECTION, courseId), {
        [ACCESS_CODE_FIELD]: newCode,
      });
      return success(newCode);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "No se pudo regenerar el código",
      });
    }
  }

  private generateAccessCode(): string {
    let code = "";
    for (let i = 0; i < ACCESS_CODE_LENGTH; i++) {
      code += ACCESS_CODE_CHARSET[Math.floor(Math.random() * ACCESS_CODE_CHARSET.length)];
    }
    return code;
  }
}