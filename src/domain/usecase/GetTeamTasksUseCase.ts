import type { TeamRepository } from "../repository/TeamRepository";
import type { KanbanTask, TaskError } from "../model/TeamModels";
import type { AppResult } from "../model/Result";

export class GetTeamTasksUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string, teamId: string): Promise<AppResult<KanbanTask[], TaskError>> {
    return this.teamRepository.getTeamTasks(courseId, teamId);
  }
}