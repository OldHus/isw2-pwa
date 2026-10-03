export interface CrashReporter {
  recordException(error: unknown): void;
}