import { httpsCallable } from "firebase/functions";
import { functions, auth } from "../firebase/config";
import {
  requestNotificationPermissionAndGetToken,
  getExistingToken,
  isMessagingSupported,
} from "../firebase/messaging";
import type { NotificationRepository } from "../../domain/repository/NotificationRepository";
import type { NotificationError, NotificationPermissionState } from "../../domain/model/NotificationModels";
import { type AppResult, success, failure } from "../../domain/model/Result";
import type { CrashReporter } from "../../domain/service/CrashReporter";

interface SubscribeResponse {
  topic: string;
}

export class NotificationRepositoryImpl implements NotificationRepository {
  private crashReporter: CrashReporter;

  constructor(crashReporter: CrashReporter) {
    this.crashReporter = crashReporter;
  }

  getPermissionState(): NotificationPermissionState {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  }

  async requestPermissionAndSubscribe(): Promise<AppResult<void, NotificationError>> {
    if (!(await isMessagingSupported())) {
      return failure({ type: "unsupported" });
    }
    if (!auth.currentUser) {
      return failure({ type: "not-authenticated" });
    }

    try {
      const token = await requestNotificationPermissionAndGetToken();
      if (!token) {
        return failure({ type: "permission-denied" });
      }

      const subscribe = httpsCallable<{ token: string }, SubscribeResponse>(
        functions,
        "subscribeToNotifications"
      );
      await subscribe({ token });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({ type: "subscribe-failed" });
    }
  }

  async unsubscribe(): Promise<AppResult<void, NotificationError>> {
    if (!auth.currentUser) {
      return failure({ type: "not-authenticated" });
    }

    try {
      const token = await getExistingToken();
      if (!token) {
        return success(undefined);
      }

      const unsubscribe = httpsCallable<{ token: string }, SubscribeResponse>(
        functions,
        "unsubscribeFromNotifications"
      );
      await unsubscribe({ token });
      return success(undefined);
    } catch (error) {
      this.crashReporter.recordException(error);
      return failure({ type: "subscribe-failed" });
    }
  }
}