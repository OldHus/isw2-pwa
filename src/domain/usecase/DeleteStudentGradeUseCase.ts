import type { AppResult } from "../model/Result";
import type { GradeError } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class DeleteStudentGradeUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string, studentUid: string, itemId: string): Promise<AppResult<void, GradeError>> {
    return this.gradeRepository.deleteStudentGrade(courseId, studentUid, itemId);
  }
}