import type { AppResult } from "../model/Result";
import type { GradeError, GradeItem } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class GetGradeItemsUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string): Promise<AppResult<GradeItem[], GradeError>> {
    return this.gradeRepository.getGradeItems(courseId);
  }
}