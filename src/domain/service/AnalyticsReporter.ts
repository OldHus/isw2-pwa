export interface AnalyticsReporter {
  logEvent(name: string, params?: Record<string, unknown>): void;
}