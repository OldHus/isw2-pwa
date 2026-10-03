import type { AppResult } from "../model/Result";
import type { AuthResult, AuthError } from "../model/AuthModels";

export interface AuthRepository {
  signInWithGoogle(): Promise<AppResult<AuthResult, AuthError>>;
  signInWithEmailAndPassword(email: string, password: string): Promise<AppResult<AuthResult, AuthError>>;
  observeSession(callback: (result: AuthResult | null) => void): () => void;
  signOut(): Promise<void>;
}