import type { AppResult } from "../model/Result";
import { failure } from "../model/Result";
import type { GradeError } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

const MIN_GRADE = 0;
const MAX_GRADE = 5;

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
    if (!Number.isFinite(grade) || grade < MIN_GRADE || grade > MAX_GRADE) {
      return Promise.resolve(failure({ type: "invalidGrade", min: MIN_GRADE, max: MAX_GRADE }));
    }
    return this.gradeRepository.setStudentGrade(courseId, studentUid, itemId, grade);
  }
}