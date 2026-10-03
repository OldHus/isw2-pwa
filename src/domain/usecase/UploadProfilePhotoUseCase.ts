import type { ProfileRepository } from "../repository/ProfileRepository";
import type { ProfilePhotoError } from "../model/ProfileModels";
import { validateProfilePhotoFile } from "../model/ProfileModels";
import { failure, type AppResult } from "../model/Result";

export class UploadProfilePhotoUseCase {
  private profileRepository: ProfileRepository;

  constructor(profileRepository: ProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(uid: string, file: File): Promise<AppResult<string, ProfilePhotoError>> {
    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      return failure(validationError);
    }
    return this.profileRepository.uploadProfilePhoto(uid, file);
  }
}