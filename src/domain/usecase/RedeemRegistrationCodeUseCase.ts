import type { CourseRepository } from "../repository/CourseRepository";
import type { RegistrationResult, RegistrationError } from "../model/RegistrationModels";
import { validateProfilePhotoFile } from "../model/ProfileModels";
import { failure, type AppResult } from "../model/Result";

export class RedeemRegistrationCodeUseCase {
  private courseRepository: CourseRepository;

  constructor(courseRepository: CourseRepository) {
    this.courseRepository = courseRepository;
  }

  async execute(code: string, photoFile?: File | null): Promise<AppResult<RegistrationResult, RegistrationError>> {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      return failure({ type: "emptyCode" });
    }

    if (photoFile) {
      const photoError = validateProfilePhotoFile(photoFile);
      if (photoError) {
        switch (photoError.type) {
          case "invalidFile":
            return failure({ type: "invalidPhoto" });
          case "tooLarge":
            return failure({ type: "photoTooLarge", maxBytes: photoError.maxBytes });
          default:
            return failure({ type: "unknown", message: photoError.message });
        }
      }
    }

    return this.courseRepository.redeemRegistrationCode(trimmedCode, photoFile ?? null);
  }
}