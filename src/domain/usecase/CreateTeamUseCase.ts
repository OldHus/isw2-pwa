import type { TeamRepository } from "../repository/TeamRepository";
import type { Team, TeamError } from "../model/TeamModels";
import { failure, type AppResult } from "../model/Result";

export class CreateTeamUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string, name: string): Promise<AppResult<Team, TeamError>> {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return Promise.resolve(failure({ type: "emptyName" }));
    }
    return this.teamRepository.createTeam(courseId, trimmedName);
  }
}