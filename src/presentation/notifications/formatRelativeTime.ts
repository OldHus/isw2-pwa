export function formatRelativeTime(millis: number): string {
  if (!millis) return "";
  const diffSeconds = Math.round((Date.now() - millis) / 1000);
  if (diffSeconds < 30) return "Justo ahora";
  if (diffSeconds < 60) return `Hace ${diffSeconds}s`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return new Date(millis).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}