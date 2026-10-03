import type { GradeItem } from "../../../domain/model/GradeModels";
import type { CourseStudent } from "../../../domain/model/CourseModels";

export type GradesMatrixUiState =
  | { status: "loading" }
  | {
      status: "success";
      items: GradeItem[];
      students: CourseStudent[];
      grades: Record<string, Record<string, number>>;
    }
  | { status: "error"; message: string };