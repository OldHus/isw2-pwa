import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import type { SyllabusRepository } from "../../domain/repository/SyllabusRepository";
import type { SyllabusError } from "../../domain/model/SyllabusModels";
import { success, failure, type AppResult } from "../../domain/model/Result";
import type { CrashReporter } from "../../domain/service/CrashReporter";

const COURSES_COLLECTION = "cursos";
const SYLLABUS_PATH_FIELD = "syllabusPdfPath";

export class SyllabusRepositoryImpl implements SyllabusRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  async getSyllabusUrl(courseId: string): Promise<AppResult<string, SyllabusError>> {
    try {
      const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
      const courseDoc = await getDoc(courseDocRef);

      if (!courseDoc.exists()) {
        return failure({ type: "notAvailable" });
      }

      const storagePath = courseDoc.data()[SYLLABUS_PATH_FIELD] as string | undefined;

      if (!storagePath) {
        return failure({ type: "notAvailable" });
      }

      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);

      return success(url);
    } catch (error) {
      const isMissingObject =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "storage/object-not-found";

      if (isMissingObject) {
        return failure({ type: "notAvailable" });
      }

      this.crashReporter.recordException(error);
      return failure({
        type: "unknown",
        message: error instanceof Error ? error.message : "Unknown error while fetching syllabus",
      });
    }
  }
}