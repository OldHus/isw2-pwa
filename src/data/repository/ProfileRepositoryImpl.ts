import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { uploadProfilePhotoFile, deleteProfilePhotoFile } from "../storage/uploadProfilePhotoFile";
import type { ProfileRepository } from "../../domain/repository/ProfileRepository";
import type { ProfilePhotoError } from "../../domain/model/ProfileModels";
import { success, failure, type AppResult } from "../../domain/model/Result";
import type { CrashReporter } from "../../domain/service/CrashReporter";

const USERS_COLLECTION = "usuarios";
const PHOTO_URL_FIELD = "fotoUrl";

function toUnknownError(e: unknown, fallback: string): ProfilePhotoError {
  return { type: "unknown", message: e instanceof Error ? e.message : fallback };
}

export class ProfileRepositoryImpl implements ProfileRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  async uploadProfilePhoto(uid: string, file: File): Promise<AppResult<string, ProfilePhotoError>> {
    try {
      const photoUrl = await uploadProfilePhotoFile(uid, file);
      await updateDoc(doc(db, USERS_COLLECTION, uid), { [PHOTO_URL_FIELD]: photoUrl });
      return success(photoUrl);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(toUnknownError(error, "No se pudo subir la foto de perfil"));
    }
  }

  async removeProfilePhoto(uid: string): Promise<AppResult<void, ProfilePhotoError>> {
    try {
      await deleteProfilePhotoFile(uid);
      await updateDoc(doc(db, USERS_COLLECTION, uid), { [PHOTO_URL_FIELD]: "" });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure(toUnknownError(error, "No se pudo quitar la foto de perfil"));
    }
  }

  observeProfilePhoto(
    uid: string,
    onChange: (photoUrl: string | null) => void,
    onError?: (error: ProfilePhotoError) => void
  ): () => void {
    return onSnapshot(
      doc(db, USERS_COLLECTION, uid),
      (snapshot) => {
        if ("docs" in snapshot) return;
        const data = snapshot.data();
        const photoUrl = ((data?.[PHOTO_URL_FIELD] as string | undefined) ?? "").trim();
        onChange(photoUrl.length > 0 ? photoUrl : null);
      },
      (error) => {
        this.crashReporter.recordException(error);
        onError?.(toUnknownError(error, "No se pudo cargar la foto de perfil"));
      }
    );
  }
}