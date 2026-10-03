import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { requestGoogleAccessToken } from "../service/GoogleIdentityService";
import type { AuthRepository } from "../../domain/repository/AuthRepository";
import type { AuthResult, AuthError } from "../../domain/model/AuthModels";
import { success, failure, type AppResult } from "../../domain/model/Result";
import type { CrashReporter } from "../../domain/service/CrashReporter";

const ALLOWED_EMAIL_DOMAIN = "@unal.edu.co";
const USERS_COLLECTION = "usuarios";
const ROLE_FIELD = "rol";
const COURSE_ID_FIELD = "cursoId";
const NAME_FIELD = "nombre";
const DEFAULT_ROLE = "estudiante";
const PHOTO_URL_FIELD = "fotoUrl";

export class AuthRepositoryImpl implements AuthRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  async signInWithGoogle(): Promise<AppResult<AuthResult, AuthError>> {
    try {
      const accessToken = await requestGoogleAccessToken();
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      const email = userCredential.user.email ?? "";

      if (!this.isInstitutionalEmail(email)) {
        await firebaseSignOut(auth);
        return failure({ type: "domainNotAllowed" });
      }

      return await this.resolveUserResult(userCredential.user);
    } catch (error) {
      return this.mapAuthError(error, "google");
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<AppResult<AuthResult, AuthError>> {
    try {
      const credential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      return await this.resolveUserResult(credential.user);
    } catch (error) {
      return this.mapAuthError(error, "email");
    }
  }

  observeSession(callback: (result: AuthResult | null) => void): () => void {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }
      try {
        const result = await this.resolveUserResult(user);
        callback(result.success ? result.data : null);
      } catch (error) {
        this.crashReporter.recordException(error);
        callback(null);
      }
    });
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  private isInstitutionalEmail(email: string): boolean {
    return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
  }

  private async resolveUserResult(user: User): Promise<AppResult<AuthResult, AuthError>> {
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      if (!data) {
        return success({ type: "newUser", uid: user.uid });
      }
      const role = (data[ROLE_FIELD] as string) ?? DEFAULT_ROLE;
      const courseId = (data[COURSE_ID_FIELD] as string) ?? "";
      const name = (data[NAME_FIELD] as string) ?? "";
      const photoUrl = (data[PHOTO_URL_FIELD] as string) ?? "";
      return success({ type: "existingUser", uid: user.uid, role, courseId, name, photoUrl });
    }

    return success({ type: "newUser", uid: user.uid });
  }

  private mapAuthError(error: unknown, method: "google" | "email"): AppResult<never, AuthError> {
    const code = (error as { code?: string })?.code ?? "";

    if (code === "gis/popup_closed_by_user" || code === "gis/access_denied") {
      return failure({ type: "cancelledByUser" });
    }

    if (code === "auth/network-request-failed" || code === "gis/network_error") {
      return failure({ type: "noInternet" });
    }

    if (
      method === "email" &&
      (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found")
    ) {
      return failure({ type: "invalidCredentials" });
    }

    this.crashReporter.recordException(error);
    return failure({
      type: "unknown",
      message: error instanceof Error ? error.message : "Unknown error while signing in",
    });
  }
}