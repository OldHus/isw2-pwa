import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase/config";

const PROFILE_PHOTOS_FOLDER = "perfiles";
const PHOTO_OBJECT_NAME = "foto";

export async function uploadProfilePhotoFile(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `${PROFILE_PHOTOS_FOLDER}/${uid}/${PHOTO_OBJECT_NAME}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return `${url}&_v=${Date.now()}`;
}

export async function deleteProfilePhotoFile(uid: string): Promise<void> {
  try {
    await deleteObject(ref(storage, `${PROFILE_PHOTOS_FOLDER}/${uid}/${PHOTO_OBJECT_NAME}`));
  } catch {
    // No Photo
  }
}