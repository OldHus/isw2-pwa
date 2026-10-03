export type CourseSettingsUiState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; accessCode: string };