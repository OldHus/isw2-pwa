import type { AppResult } from "../model/Result";
import type { ProfilePhotoError } from "../model/ProfileModels";

export interface ProfileRepository {
  uploadProfilePhoto(uid: string, file: File): Promise<AppResult<string, ProfilePhotoError>>;

  removeProfilePhoto(uid: string): Promise<AppResult<void, ProfilePhotoError>>;

  observeProfilePhoto(
    uid: string,
    onChange: (photoUrl: string | null) => void,
    onError?: (error: ProfilePhotoError) => void
  ): () => void;
}