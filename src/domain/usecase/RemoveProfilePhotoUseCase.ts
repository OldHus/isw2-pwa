import type { ProfileRepository } from "../repository/ProfileRepository";
import type { ProfilePhotoError } from "../model/ProfileModels";
import type { AppResult } from "../model/Result";

export class RemoveProfilePhotoUseCase {
  private profileRepository: ProfileRepository;

  constructor(profileRepository: ProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async execute(uid: string): Promise<AppResult<void, ProfilePhotoError>> {
    return this.profileRepository.removeProfilePhoto(uid);
  }
}