import type { AppResult } from "../model/Result";
import { failure } from "../model/Result";
import type { GradeError } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class UpdateGradeItemUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(courseId: string, itemId: string, name: string): Promise<AppResult<void, GradeError>> {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return Promise.resolve(
        failure({ type: "unknown", message: "El nombre del ítem no puede estar vacío" })
      );
    }
    return this.gradeRepository.updateGradeItem(courseId, itemId, trimmedName);
  }
}