import type { TeamRepository } from "../repository/TeamRepository";
import type { TeamError } from "../model/TeamModels";
import type { AppResult } from "../model/Result";

export class AddStudentToTeamUseCase {
  private teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
  }

  execute(courseId: string, teamId: string, studentUid: string): Promise<AppResult<void, TeamError>> {
    return this.teamRepository.addStudentToTeam(courseId, teamId, studentUid);
  }
}