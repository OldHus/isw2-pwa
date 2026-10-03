import type { AppResult } from "../model/Result";
import type { CourseError, CourseStudent } from "../model/CourseModels";
import type { CourseRepository } from "../repository/CourseRepository";

export class GetCourseStudentsUseCase {
  private courseRepository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.courseRepository = courseRepository;
  }

  execute(courseId: string): Promise<AppResult<CourseStudent[], CourseError>> {
    return this.courseRepository.getCourseStudents(courseId);
  }
}