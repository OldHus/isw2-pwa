export type NotificationPermissionState = "unsupported" | "default" | "denied" | "granted";

export type NotificationError =
  | { type: "unsupported" }
  | { type: "permission-denied" }
  | { type: "token-failed" }
  | { type: "subscribe-failed" }
  | { type: "not-authenticated" }
  | { type: "unknown"; message: string };