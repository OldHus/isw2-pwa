import { useEffect } from "react";
import type { ActivityItem } from "../../domain/model/ActivityFeedModels";
import { NotificationIcon } from "./NotificationIcon";
import styles from "./NotificationToastStack.module.scss";

const AUTO_DISMISS_MS = 7000;

interface NotificationToastStackProps {
  toasts: ActivityItem[];
  onDismiss: (id: string) => void;
  onToastClick: (item: ActivityItem) => void;
}

export function NotificationToastStack({ toasts, onDismiss, onToastClick }: NotificationToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} onClick={onToastClick} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
  onClick,
}: {
  toast: ActivityItem;
  onDismiss: (id: string) => void;
  onClick: (item: ActivityItem) => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [toast.id, onDismiss]);

  return (
    <button type="button" className={styles.toast} onClick={() => onClick(toast)}>
      <NotificationIcon type={toast.type} />
      <div className={styles.body}>
        <p className={styles.title}>{toast.title}</p>
        <p className={styles.text}>{toast.body}</p>
      </div>
      <span
        className={styles.dismiss}
        role="button"
        aria-label="Cerrar"
        onClick={(event) => {
          event.stopPropagation();
          onDismiss(toast.id);
        }}
      >
        ×
      </span>
    </button>
  );
}