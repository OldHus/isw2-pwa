import type { AppResult } from "../model/Result";
import type { GradeError, StudentGrades } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class GetStudentGradesUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string, studentUid: string): Promise<AppResult<StudentGrades, GradeError>> {
    return this.gradeRepository.getStudentGrades(courseId, studentUid);
  }
}