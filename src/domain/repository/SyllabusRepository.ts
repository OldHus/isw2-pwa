import type { AppResult } from "../model/Result";
import type { SyllabusError } from "../model/SyllabusModels";

export interface SyllabusRepository {
  getSyllabusUrl(courseId: string): Promise<AppResult<string, SyllabusError>>;
}