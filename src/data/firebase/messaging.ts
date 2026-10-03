import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";
import { firebaseApp, firebaseConfig } from "./config";

const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingInstance: Messaging | null = null;
let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

function buildServiceWorkerUrl(): string {
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? "",
    authDomain: firebaseConfig.authDomain ?? "",
    projectId: firebaseConfig.projectId ?? "",
    storageBucket: firebaseConfig.storageBucket ?? "",
    messagingSenderId: firebaseConfig.messagingSenderId ?? "",
    appId: firebaseConfig.appId ?? "",
  });
  return `${SERVICE_WORKER_PATH}?${params.toString()}`;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(buildServiceWorkerUrl(), { scope: "/" })
      .then(() => navigator.serviceWorker.ready);
  }
  return registrationPromise;
}

export async function isMessagingSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  return isSupported();
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  if (!(await isMessagingSupported())) return null;
  messagingInstance = getMessaging(firebaseApp);
  return messagingInstance;
}

export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await getRegistration();
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  return token || null;
}

export async function getExistingToken(): Promise<string | null> {
  if (Notification.permission !== "granted") return null;
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const registration = await getRegistration();
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  return token || null;
}

export interface ForegroundNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}


export async function observeForegroundMessages(
  onNotification: (payload: ForegroundNotificationPayload) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    onNotification({
      title: payload.notification?.title ?? "Ingesoft II",
      body: payload.notification?.body ?? "",
      data: payload.data,
    });
  });
}