import type { AuthRepository } from "../repository/AuthRepository";

export class SignInWithEmailPasswordUseCase {
  private authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  execute(email: string, password: string) {
    return this.authRepository.signInWithEmailAndPassword(email, password);
  }
}