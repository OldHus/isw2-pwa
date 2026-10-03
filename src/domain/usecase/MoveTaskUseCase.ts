import type { TeamRepository } from "../repository/TeamRepository";
import type { TaskColumnValue, TaskError } from "../model/TeamModels";
import { canTransitionTask } from "../model/TaskTransitionPolicy";
import { failure, type AppResult } from "../model/Result";
import type { UserRole } from "../../store/slices/sessionSlice";

export class MoveTaskUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(
    courseId: string,
    teamId: string,
    taskId: string,
    role: UserRole,
    from: TaskColumnValue,
    to: TaskColumnValue
  ): Promise<AppResult<void, TaskError>> {
    if (!canTransitionTask(role, from, to)) {
      return Promise.resolve(failure({ type: "invalidTransition", from, to }));
    }
    return this.teamRepository.moveTask(courseId, teamId, taskId, to);
  }
}