import type { GradeItem } from "../../../domain/model/GradeModels";
import type { CourseStudent } from "../../../domain/model/CourseModels";

export type StudentGradeEditUiState =
  | { status: "loading" }
  | {
      status: "success";
      student: CourseStudent;
      items: GradeItem[];
      grades: Record<string, number>;
    }
  | { status: "error"; message: string };