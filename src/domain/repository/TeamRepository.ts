import type { AppResult } from "../model/Result";
import type { KanbanTask, TaskColumnValue, TaskError, Team, TeamError } from "../model/TeamModels";

export interface TeamRepository {
  createTeam(courseId: string, name: string): Promise<AppResult<Team, TeamError>>;
  getCourseTeams(courseId: string): Promise<AppResult<Team[], TeamError>>;
  getTeamById(courseId: string, teamId: string): Promise<AppResult<Team, TeamError>>;
  addStudentToTeam(courseId: string, teamId: string, studentUid: string): Promise<AppResult<void, TeamError>>;
  removeStudentFromTeam(
    courseId: string,
    teamId: string,
    studentUid: string
  ): Promise<AppResult<void, TeamError>>;

  getMyTeam(courseId: string): Promise<AppResult<Team | null, TeamError>>;

  renameTeam(courseId: string, teamId: string, newName: string): Promise<AppResult<void, TeamError>>;
  deleteTeam(courseId: string, teamId: string): Promise<AppResult<void, TeamError>>;

  getTeamTasks(courseId: string, teamId: string): Promise<AppResult<KanbanTask[], TaskError>>;

  createTask(
    courseId: string,
    teamId: string,
    title: string,
    description: string
  ): Promise<AppResult<KanbanTask, TaskError>>;

  moveTask(
    courseId: string,
    teamId: string,
    taskId: string,
    newColumn: TaskColumnValue
  ): Promise<AppResult<void, TaskError>>;

  deleteTask(courseId: string, teamId: string, taskId: string): Promise<AppResult<void, TaskError>>;
}