const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export function formatRelativeTime(timestampMs: number): string {
  if (!timestampMs) return "";

  const diffMs = Date.now() - timestampMs;
  if (diffMs < MINUTE_MS) return "Hace un momento";
  if (diffMs < HOUR_MS) return `Hace ${Math.floor(diffMs / MINUTE_MS)} min`;
  if (diffMs < DAY_MS) return `Hace ${Math.floor(diffMs / HOUR_MS)} h`;
  if (diffMs < WEEK_MS) {
    const days = Math.floor(diffMs / DAY_MS);
    return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
  }
  if (diffMs < WEEK_MS * 4) {
    const weeks = Math.floor(diffMs / WEEK_MS);
    return weeks === 1 ? "Hace 1 sem" : `Hace ${weeks} sem`;
  }

  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(timestampMs));
}