import type { NotificationRepository } from "../repository/NotificationRepository";
import type { NotificationError } from "../model/NotificationModels";
import type { AppResult } from "../model/Result";

export class SubscribeToCourseNotificationsUseCase {
  private repository: NotificationRepository;

  constructor(repository: NotificationRepository) {
    this.repository = repository;
  }

  execute(): Promise<AppResult<void, NotificationError>> {
    return this.repository.requestPermissionAndSubscribe();
  }
}