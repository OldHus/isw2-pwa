export type LoginUiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "existingUserSuccess"; role: string; courseId: string }
  | { status: "newUserSuccess"; uid: string };