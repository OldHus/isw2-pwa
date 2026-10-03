export type CourseCodeUiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; role: string; courseId: string }
  | { status: "error"; message: string };