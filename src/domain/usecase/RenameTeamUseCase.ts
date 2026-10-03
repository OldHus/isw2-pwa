import type { TeamRepository } from "../repository/TeamRepository";
import type { TeamError } from "../model/TeamModels";
import { failure, type AppResult } from "../model/Result";

export class RenameTeamUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string, teamId: string, newName: string): Promise<AppResult<void, TeamError>> {
    const trimmedName = newName.trim();
    if (trimmedName.length === 0) {
      return Promise.resolve(failure({ type: "emptyName" }));
    }
    return this.teamRepository.renameTeam(courseId, teamId, trimmedName);
  }
}