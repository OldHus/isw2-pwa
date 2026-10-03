import type { TeamRepository } from "../repository/TeamRepository";
import type { Team, TeamError } from "../model/TeamModels";
import type { AppResult } from "../model/Result";

export class GetMyTeamUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string): Promise<AppResult<Team | null, TeamError>> {
    return this.teamRepository.getMyTeam(courseId);
  }
}