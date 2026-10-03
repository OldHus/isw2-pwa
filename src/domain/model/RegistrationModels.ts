export interface RegistrationResult {
  uid: string;
  role: string;
  courseId: string;
  name: string;
  photoUrl: string;
}

export type RegistrationError =
  | { type: "emptyCode" }
  | { type: "invalidCode" }
  | { type: "userNotAuthenticated" }
  | { type: "invalidPhoto" }
  | { type: "photoTooLarge"; maxBytes: number }
  | { type: "unknown"; message: string };