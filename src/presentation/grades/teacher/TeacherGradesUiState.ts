import type { GradeItem } from "../../../domain/model/GradeModels";
import type { CourseStudent } from "../../../domain/model/CourseModels";

export type TeacherGradesUiState =
  | { status: "loading" }
  | { status: "success"; items: GradeItem[]; students: CourseStudent[] }
  | { status: "error"; message: string };