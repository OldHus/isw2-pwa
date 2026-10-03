export type SyllabusUiState =
  | { status: "loading" }
  | { status: "success"; url: string }
  | { status: "notAvailable" }
  | { status: "error"; message: string };