import type { SyllabusRepository } from "../repository/SyllabusRepository";
import type { AppResult } from "../model/Result";
import type { SyllabusError } from "../model/SyllabusModels";

export class GetSyllabusUrlUseCase {
  private syllabusRepository: SyllabusRepository;

  constructor(syllabusRepository: SyllabusRepository) {
    this.syllabusRepository = syllabusRepository;
  }

  execute(courseId: string): Promise<AppResult<string, SyllabusError>> {
    return this.syllabusRepository.getSyllabusUrl(courseId);
  }
}