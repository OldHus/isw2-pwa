import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { container } from "../../../di/container";
import type { ActivityItem } from "../../../domain/model/ActivityFeedModels";

export interface NotificationItem extends ActivityItem {
  read: boolean;
}

const MAX_STORED_IDS = 200;

function readKey(uid: string): string {
  return `notif_read_ids_${uid}`;
}

function hiddenKey(uid: string): string {
  return `notif_hidden_ids_${uid}`;
}

function loadIdSet(key: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveIdSet(key: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(ids).slice(-MAX_STORED_IDS)));
  } catch {
    // localStorage no available
  }
}

export interface NotificationCenter {
  items: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markManyRead: (ids: string[]) => void;
  markManyUnread: (ids: string[]) => void;
  dismiss: (id: string) => void;
  dismissMany: (ids: string[]) => void;
  markAllRead: () => void;
  toasts: ActivityItem[];
  dismissToast: (id: string) => void;
}


export function useNotificationCenter(): NotificationCenter {
  const session = useAppSelector((state) => state.session);
  const [rawItems, setRawItems] = useState<ActivityItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ActivityItem[]>([]);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    if (session.uid) {
      uidRef.current = session.uid;
      setReadIds(loadIdSet(readKey(session.uid)));
      setHiddenIds(loadIdSet(hiddenKey(session.uid)));
    }
  }, [session.uid]);

  useEffect(() => {
    if (!session.courseId) {
      setRawItems([]);
      knownIdsRef.current = null;
      return;
    }
    knownIdsRef.current = null;

    const unsubscribe = container.observeCourseActivityUseCase.execute(
      session.courseId,
      (items) => {
        if (knownIdsRef.current === null) {
          knownIdsRef.current = new Set(items.map((item) => item.id));
        } else {
          const previous = knownIdsRef.current;
          const freshOnes = items.filter((item) => !previous.has(item.id));
          if (freshOnes.length > 0) {
            setToasts((current) => [...freshOnes, ...current].slice(0, 5));
          }
          knownIdsRef.current = new Set(items.map((item) => item.id));
        }
        setRawItems(items);
      },
      (error) => {
        container.crashReporter.recordException(error);
      }
    );

    return unsubscribe;
  }, [session.courseId]);

  const markRead = useCallback((id: string) => {
    setReadIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      if (uidRef.current) saveIdSet(readKey(uidRef.current), next);
      return next;
    });
  }, []);

  const markUnread = useCallback((id: string) => {
    setReadIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      if (uidRef.current) saveIdSet(readKey(uidRef.current), next);
      return next;
    });
  }, []);

  const markManyRead = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setReadIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      if (uidRef.current) saveIdSet(readKey(uidRef.current), next);
      return next;
    });
  }, []);

  const markManyUnread = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setReadIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      if (uidRef.current) saveIdSet(readKey(uidRef.current), next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((current) => {
      const next = new Set(current);
      rawItems.forEach((item) => next.add(item.id));
      if (uidRef.current) saveIdSet(readKey(uidRef.current), next);
      return next;
    });
  }, [rawItems]);

  const dismiss = useCallback((id: string) => {
    setHiddenIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      if (uidRef.current) saveIdSet(hiddenKey(uidRef.current), next);
      return next;
    });
  }, []);

  const dismissMany = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setHiddenIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      if (uidRef.current) saveIdSet(hiddenKey(uidRef.current), next);
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const items: NotificationItem[] = rawItems
    .filter((item) => !hiddenIds.has(item.id))
    .map((item) => ({ ...item, read: readIds.has(item.id) }));
  const unreadCount = items.reduce((count, item) => (item.read ? count : count + 1), 0);

  return {
    items,
    unreadCount,
    markRead,
    markUnread,
    markManyRead,
    markManyUnread,
    dismiss,
    dismissMany,
    markAllRead,
    toasts,
    dismissToast,
  };
}