import type { CrashReporter } from "../../domain/service/CrashReporter";

export class ConsoleCrashReporter implements CrashReporter {
  recordException(error: unknown): void {
    console.error("[CrashReporter]", error);
  }
}