import type { AppResult } from "../model/Result";
import { failure } from "../model/Result";
import { MIN_GRADE } from "../model/GradeModels";
import type { GradeCellUpdate, GradeError } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

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
      if (!Number.isFinite(update.grade) || update.grade < MIN_GRADE) {
        return Promise.resolve(failure({ type: "invalidGrade", min: MIN_GRADE }));
      }
    }
    return this.gradeRepository.setManyStudentGrades(courseId, updates);
  }
}
