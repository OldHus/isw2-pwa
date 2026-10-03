import { logEvent as firebaseLogEvent } from "firebase/analytics";
import { analytics } from "../firebase/config";
import type { AnalyticsReporter } from "../../domain/service/AnalyticsReporter";

export class FirebaseAnalyticsReporter implements AnalyticsReporter {
  logEvent(name: string, params?: Record<string, unknown>): void {
    if (!analytics) return;
    firebaseLogEvent(analytics, name, params);
  }
}