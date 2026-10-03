import type { AppResult } from "../model/Result";
import type { NotificationError, NotificationPermissionState } from "../model/NotificationModels";

export interface NotificationRepository {
  getPermissionState(): NotificationPermissionState;
  requestPermissionAndSubscribe(): Promise<AppResult<void, NotificationError>>;
  unsubscribe(): Promise<AppResult<void, NotificationError>>;
}