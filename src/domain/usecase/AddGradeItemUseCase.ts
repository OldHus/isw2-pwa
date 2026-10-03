import type { AppResult } from "../model/Result";
import { failure } from "../model/Result";
import type { GradeError, GradeItem } from "../model/GradeModels";
import type { GradeRepository } from "../repository/GradeRepository";

export class AddGradeItemUseCase {
  private gradeRepository: GradeRepository;

  constructor(gradeRepository: GradeRepository) {
    this.gradeRepository = gradeRepository;
  }

  execute(
    courseId: string,
    name: string,
    weight: number,
    type: string
  ): Promise<AppResult<GradeItem, GradeError>> {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return Promise.resolve(
        failure({ type: "unknown", message: "El nombre del ítem no puede estar vacío" })
      );
    }
    
    return this.gradeRepository.addGradeItem(courseId, trimmedName, weight, type);
  }
}