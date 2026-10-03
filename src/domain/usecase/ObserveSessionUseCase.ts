import type { AuthRepository } from "../repository/AuthRepository";
import type { AuthResult } from "../model/AuthModels";

export class ObserveSessionUseCase {
  private authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  execute(callback: (result: AuthResult | null) => void): () => void {
    return this.authRepository.observeSession(callback);
  }
}