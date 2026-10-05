import type { AppResult } from "../model/Result";
import { failure } from "../model/Result";
import type { GradeCellUpdate, GradeError } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

const MIN_GRADE = 0;
const MAX_GRADE = 5;

export class SetManyStudentGradesUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string, updates: GradeCellUpdate[]): Promise<AppResult<void, GradeError>> {
    if (updates.length === 0) {
      return this.gradeRepository.setManyStudentGrades(courseId, updates);
    }
    for (const update of updates) {
      if (update.grade === null) continue;
      if (!Number.isFinite(update.grade) || update.grade < MIN_GRADE || update.grade > MAX_GRADE) {
        return Promise.resolve(failure({ type: "invalidGrade", min: MIN_GRADE, max: MAX_GRADE }));
      }
    }
    return this.gradeRepository.setManyStudentGrades(courseId, updates);
  }
}
