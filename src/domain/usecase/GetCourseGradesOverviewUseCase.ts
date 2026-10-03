import type { AppResult } from "../model/Result";
import type { GradeError, StudentGrades } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class GetCourseGradesOverviewUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string): Promise<AppResult<Record<string, StudentGrades>, GradeError>> {
    return this.gradeRepository.getAllStudentsGrades(courseId);
  }
}