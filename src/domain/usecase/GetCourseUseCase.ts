import type { CourseRepository } from "../repository/CourseRepository";
import type { Course, CourseError } from "../model/CourseModels";
import type { AppResult } from "../model/Result";

export class GetCourseUseCase {
  private courseRepository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.courseRepository = courseRepository;
  }

  execute(courseId: string): Promise<AppResult<Course, CourseError>> {
    return this.courseRepository.getCourse(courseId);
  }
}