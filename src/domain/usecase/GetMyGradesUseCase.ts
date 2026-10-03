import type { AppResult } from "../model/Result";
import type { GradeError, StudentGrades } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class GetMyGradesUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string): Promise<AppResult<StudentGrades, GradeError>> {
    return this.gradeRepository.getMyGrades(courseId);
  }
}