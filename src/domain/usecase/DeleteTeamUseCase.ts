import type { TeamRepository } from "../repository/TeamRepository";
import type { TeamError } from "../model/TeamModels";
import type { AppResult } from "../model/Result";

export class DeleteTeamUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string, teamId: string): Promise<AppResult<void, TeamError>> {
    return this.teamRepository.deleteTeam(courseId, teamId);
  }
}