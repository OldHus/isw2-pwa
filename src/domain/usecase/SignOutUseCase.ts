import type { AuthRepository } from "../repository/AuthRepository";

export class SignOutUseCase {
  private authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  execute() {
    return this.authRepository.signOut();
  }
}