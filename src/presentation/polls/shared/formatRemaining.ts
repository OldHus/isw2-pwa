export function formatRemaining(remainingMillis: number): string {
  if (remainingMillis <= 0) return "Cerrada";

  const totalSeconds = Math.floor(remainingMillis / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `Cierra en ${days}d ${hours}h`;
  if (hours > 0) return `Cierra en ${hours}h ${minutes}m`;
  if (minutes > 0) return `Cierra en ${minutes}m ${seconds}s`;
  return `Cierra en ${seconds}s`;
}