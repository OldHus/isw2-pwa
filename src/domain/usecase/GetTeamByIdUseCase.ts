import type { TeamRepository } from "../repository/TeamRepository";
import type { Team, TeamError } from "../model/TeamModels";
import type { AppResult } from "../model/Result";

export class GetTeamByIdUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string, teamId: string): Promise<AppResult<Team, TeamError>> {
    return this.teamRepository.getTeamById(courseId, teamId);
  }
}