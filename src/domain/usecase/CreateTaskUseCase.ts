import type { TeamRepository } from "../repository/TeamRepository";
import type { KanbanTask, TaskError } from "../model/TeamModels";
import { failure, type AppResult } from "../model/Result";

export class CreateTaskUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(
    courseId: string,
    teamId: string,
    title: string,
    description: string
  ): Promise<AppResult<KanbanTask, TaskError>> {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return Promise.resolve(failure({ type: "emptyTitle" }));
    }
    return this.teamRepository.createTask(courseId, teamId, trimmedTitle, description.trim());
  }
}