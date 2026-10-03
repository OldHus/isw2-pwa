import type { KanbanTask, Team } from "../../../domain/model/TeamModels";

export type StudentTeamBoardUiState =
  | { status: "loading" }
  | { status: "noTeamAssigned" }
  | { status: "success"; team: Team; tasks: KanbanTask[] }
  | { status: "error"; message: string };