import type { AppResult } from "../model/Result";
import type { Course, CourseError, CourseStudent } from "../model/CourseModels";
import type { RegistrationResult, RegistrationError } from "../model/RegistrationModels";

export interface CourseRepository {
  getCourse(courseId: string): Promise<AppResult<Course, CourseError>>;

  getCourseStudents(courseId: string): Promise<AppResult<CourseStudent[], CourseError>>;

  redeemRegistrationCode(
    code: string,
    photoFile?: File | null
  ): Promise<AppResult<RegistrationResult, RegistrationError>>;

  regenerateAccessCode(courseId: string): Promise<AppResult<string, CourseError>>;
}