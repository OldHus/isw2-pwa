import type { Team } from "../../../domain/model/TeamModels";

export type TeacherTeamsUiState =
  | { status: "loading" }
  | { status: "success"; teams: Team[] }
  | { status: "error"; message: string };