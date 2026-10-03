import type { TeamRepository } from "../repository/TeamRepository";
import type { TaskError } from "../model/TeamModels";
import type { AppResult } from "../model/Result";

export class DeleteTaskUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string, teamId: string, taskId: string): Promise<AppResult<void, TaskError>> {
    return this.teamRepository.deleteTask(courseId, teamId, taskId);
  }
}