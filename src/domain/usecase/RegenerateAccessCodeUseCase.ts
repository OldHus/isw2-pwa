import type { CourseRepository } from "../repository/CourseRepository";
import type { CourseError } from "../model/CourseModels";
import type { AppResult } from "../model/Result";

export class RegenerateAccessCodeUseCase {
  private courseRepository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.courseRepository = courseRepository;
  }

  execute(courseId: string): Promise<AppResult<string, CourseError>> {
    return this.courseRepository.regenerateAccessCode(courseId);
  }
}