import type { Course } from "../../domain/model/CourseModels";

export type HomeUiState =
  | { status: "loading" }
  | { status: "success"; course: Course }
  | { status: "error"; message: string };