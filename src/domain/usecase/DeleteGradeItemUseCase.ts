import type { AppResult } from "../model/Result";
import type { GradeError } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class DeleteGradeItemUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string, itemId: string): Promise<AppResult<void, GradeError>> {
    return this.gradeRepository.deleteGradeItem(courseId, itemId);
  }
}