import type { CourseStudent } from "../../../domain/model/CourseModels";
import type { KanbanTask, Team } from "../../../domain/model/TeamModels";

export type TeacherTeamBoardUiState =
  | { status: "loading" }
  | {
      status: "success";
      team: Team;
      members: CourseStudent[];
      availableStudents: CourseStudent[];
      tasks: KanbanTask[];
    }
  | { status: "error"; message: string };