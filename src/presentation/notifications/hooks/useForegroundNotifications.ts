import { useEffect } from "react";
import { observeForegroundMessages } from "../../../data/firebase/messaging";

export function useForegroundNotifications() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    observeForegroundMessages(async ({ title, body, data }) => {
      if (Notification.permission !== "granted") return;
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data?.type ?? "ingesoft",
        data: data ?? {},
      });
    }).then((unsub) => {
      if (cancelled) {
        unsub();
      } else {
        unsubscribe = unsub;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);
}