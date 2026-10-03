
export type ProfilePhotoError =
  | { type: "invalidFile" }
  | { type: "tooLarge"; maxBytes: number }
  | { type: "unknown"; message: string };

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateProfilePhotoFile(file: File): ProfilePhotoError | null {
  if (!ACCEPTED_PROFILE_PHOTO_TYPES.includes(file.type)) {
    return { type: "invalidFile" };
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return { type: "tooLarge", maxBytes: MAX_PROFILE_PHOTO_BYTES };
  }
  return null;
}