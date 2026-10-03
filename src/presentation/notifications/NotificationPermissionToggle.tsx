import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { container } from "../../di/container";
import { useAppSelector } from "../../store/hooks";
import type { NotificationPermissionState } from "../../domain/model/NotificationModels";
import styles from "./NotificationPermissionToggle.module.scss";

function subscribedKey(uid: string): string {
  return `notif_push_subscribed_${uid}`;
}

function loadSubscribed(uid: string, permission: NotificationPermissionState): boolean {
  try {
    const raw = window.localStorage.getItem(subscribedKey(uid));
    if (raw !== null) return raw === "true";
  } catch {
    // localStorage no available
  }
  
  return permission === "granted";
}

function saveSubscribed(uid: string, value: boolean): void {
  try {
    window.localStorage.setItem(subscribedKey(uid), String(value));
  } catch {
    // localStorage no available
  }
}

export function NotificationPermissionToggle() {
  const uid = useAppSelector((state) => state.session.uid);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const currentPermission = container.notificationRepository.getPermissionState();
    setPermission(currentPermission);
    if (uid) {
      setIsSubscribed(loadSubscribed(uid, currentPermission));
    }
  }, [uid]);

  const onToggle = async () => {
    setIsBusy(true);
    try {
      if (isSubscribed) {
        const result = await container.notificationRepository.unsubscribe();
        if (result.success) {
          setIsSubscribed(false);
          if (uid) saveSubscribed(uid, false);
        }
      } else {
        const result = await container.notificationRepository.requestPermissionAndSubscribe();
        if (result.success) {
          setIsSubscribed(true);
          if (uid) saveSubscribed(uid, true);
        }
      }
    } finally {
      setPermission(container.notificationRepository.getPermissionState());
      setIsBusy(false);
    }
  };

  const isUnsupported = permission === "unsupported";
  const isDenied = permission === "denied";

  return (
    <div className={styles.wrapper}>
      <div className={styles.info}>
        {isSubscribed ? (
          <BellRing size={16} className={styles.iconOn} />
        ) : (
          <BellOff size={16} className={styles.iconOff} />
        )}
        <span>
          {isUnsupported
            ? "Tu navegador no soporta notificaciones push."
            : isDenied
              ? "Bloqueaste el permiso en el navegador."
              : isSubscribed
                ? "Notificaciones push activadas"
                : "Notificaciones push desactivadas"}
        </span>
      </div>
      {!isUnsupported && !isDenied && (
        <button type="button" className={styles.toggleButton} onClick={onToggle} disabled={isBusy}>
          {isBusy ? <Loader2 size={14} className={styles.spin} /> : isSubscribed ? "Desactivar" : "Activar"}
        </button>
      )}
    </div>
  );
}