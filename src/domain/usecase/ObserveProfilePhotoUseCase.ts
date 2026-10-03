import type { ProfileRepository } from "../repository/ProfileRepository";

export class ObserveProfilePhotoUseCase {
  private profileRepository: ProfileRepository;

  constructor(profileRepository: ProfileRepository) {
    this.profileRepository = profileRepository;
  }

  execute(uid: string, onChange: (photoUrl: string | null) => void): () => void {
    return this.profileRepository.observeProfilePhoto(uid, onChange);
  }
}