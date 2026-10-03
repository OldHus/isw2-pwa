import type { GradeItem } from "../../../domain/model/GradeModels";

export type StudentGradesUiState =
  | { status: "loading" }
  | { status: "success"; items: GradeItem[]; grades: Record<string, number> }
  | { status: "error"; message: string };