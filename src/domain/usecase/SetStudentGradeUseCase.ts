import type { AppResult } from "../model/Result";
import { failure } from "../model/Result";
import { MIN_GRADE } from "../model/GradeModels";
import type { GradeError } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class SetStudentGradeUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(
    courseId: string,
    studentUid: string,
    itemId: string,
    grade: number
  ): Promise<AppResult<void, GradeError>> {
    if (!Number.isFinite(grade) || grade < MIN_GRADE) {
      return Promise.resolve(failure({ type: "invalidGrade", min: MIN_GRADE }));
    }
    return this.gradeRepository.setStudentGrade(courseId, studentUid, itemId, grade);
  }
}
