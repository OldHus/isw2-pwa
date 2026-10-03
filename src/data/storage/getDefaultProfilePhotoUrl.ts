import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";

const DEFAULT_PHOTOS_FOLDER = "perfiles/_default";

const DEFAULT_PHOTO_FILENAMES: Record<"docente" | "estudiante", string> = {
  docente: "docente.jpg",
  estudiante: "estudiante.jpg",
};

const cache = new Map<string, Promise<string | null>>();

export function getDefaultProfilePhotoUrl(role: "docente" | "estudiante"): Promise<string | null> {
  const cached = cache.get(role);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const fileName = DEFAULT_PHOTO_FILENAMES[role];
      const storageRef = ref(storage, `${DEFAULT_PHOTOS_FOLDER}/${fileName}`);
      return await getDownloadURL(storageRef);
    } catch {
      return null;
    }
  })();

  cache.set(role, promise);
  return promise;
}